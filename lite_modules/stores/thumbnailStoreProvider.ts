import { ThumbnailResponseState } from '@rbx/thumbnails';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import {
  getThumbnailsByAssetIds,
  getThumbnailsByUniverseIds,
} from '@services/thumbnails/getThumbnailService';
import { getHttpStatusFromError } from '@type/errorResponse';
import { ThumbnailType } from '@type/thumbnail';
import { CaptureException } from '@utils/error';
import { EmptyRequestStateType, GetEmptyRequestState } from '@utils/zustandUtils';

// Asset-thumbnail entries also track the HTTP status of a failed request so the
// UI can distinguish transient, retryable failures (e.g. 503 load-shedding)
// from terminal ones.
interface ThumbnailRequestStateType extends EmptyRequestStateType<ThumbnailType> {
  errorStatus?: number;
}

interface ThumbnailStoreStateType {
  blobByAssetId: Record<number, Blob>;
  /** Presigned S3 URLs for AI-generated assets pending moderation review. */
  previewUrlByAssetId: Record<number, string>;
  thumbnailsByAssetId: Record<number, ThumbnailRequestStateType>;
  thumbnailsByUniverseId: Record<number, EmptyRequestStateType<ThumbnailType>>;
}

interface ThumbnailStoreActionType {
  getThumbnail: (universeId: number) => void;
  getThumbnailByAssetId: (assetId: number) => void;
  getThumbnailsBatch: (universeIds: number[]) => void;
  setBlobByAssetId: (assetId: number, blob: Blob) => void;
  setPreviewUrlByAssetId: (assetId: number, previewUrl: string) => void;
}

export interface ThumbnailStoreType extends ThumbnailStoreStateType, ThumbnailStoreActionType {}

// Per-asset thumbnail requests are coalesced into a single bulk call. The
// thumbnails service enforces adaptive concurrency limits and returns 503s when
// a grid of creatives fires one request per tile, so we collect every assetId
// requested within a short window and fetch them in one `assetIds=` call
// (chunked), mirroring the universe batch path.
//
// The thumbnails `/assets` endpoint rejects oversized batches with a 400, so the
// chunk size must stay under its per-request cap. The Roblox thumbnails SDK
// (`@rbx/thumbnails`) batches at 50, so we match that proven-safe limit.
const ASSET_BATCH_SIZE = 50;
const ASSET_BATCH_DELAY_MS = 16;

// Bounded self-healing retries for the asset batch path. The thumbnails service
// can return a row in a non-final state (Pending / InReview /
// TemporarilyUnavailable), omit a freshly-created asset entirely (AI-generated
// creatives lag the thumbnails pipeline), or shed load with a transient 5xx/429.
// All of these are recoverable, so we re-enqueue the affected assetIds with
// exponential backoff + jitter instead of leaving the tile stuck on a
// placeholder. Centralizing this in the store means every consumer
// (AssetThumbnail, AssetTileImage, CreativeAssetImage, …) self-heals without its
// own retry loop.
//
// Retries are grouped into shared rounds by attempt level (see
// `scheduleAssetRetry`): every asset that reaches the same backoff tier flushes
// together in one bulk request. Previously each asset armed its own
// independently-jittered timer, so a wave of non-final assets scattered into one
// thumbnail request per asset; bucketing by level collapses that back into one
// request per tier while preserving the same per-asset budget and backoff curve.
const ASSET_MAX_RETRY_ATTEMPTS = 8;
const ASSET_RETRY_BASE_MS = 1000;
const ASSET_RETRY_MAX_DELAY_MS = 15000;

const computeAssetRetryDelayMs = (attempt: number): number => {
  const cappedDelay = Math.min(ASSET_RETRY_MAX_DELAY_MS, ASSET_RETRY_BASE_MS * 2 ** attempt);
  const half = cappedDelay / 2;
  return Math.round(half + Math.random() * half);
};

// Transient HTTP failures worth retrying. `undefined` covers network errors and
// non-HTTP throws. Client errors (400/401/403/404, etc.) are terminal since
// retrying won't change the outcome.
const RetryableErrorStatuses = new Set<number>([408, 425, 429, 500, 502, 503, 504]);

const isRetryableErrorStatus = (status?: number): boolean =>
  status === undefined || RetryableErrorStatuses.has(status);

// A returned row in one of these states isn't final yet — the image may still
// materialize, so keep polling until it does (or the budget runs out).
const NonFinalThumbnailStates = new Set<ThumbnailResponseState>([
  ThumbnailResponseState.Pending,
  ThumbnailResponseState.InReview,
  ThumbnailResponseState.TemporarilyUnavailable,
]);

// A thumbnail is "done" once it's Completed with a usable CDN URL. These never
// change, so there's nothing to gain from re-requesting them — the bulk flush
// drops them from the batch (see `flushAssetThumbnailQueue`) so an entry that's
// already resolved can never ride along on another request.
const isUsableCompletedThumbnail = (entry?: ThumbnailRequestStateType): boolean =>
  entry?.data?.state === ThumbnailResponseState.Completed &&
  Boolean(entry.data.imageUrl) &&
  !entry.isError;

// Assigned when the store initializes so tests can clear the module-closure
// queue/retry state (pending IDs, in-flight flag, attempt counters, timer) that
// lives outside the Zustand slice and is therefore not reset by `setState`.
let resetThumbnailQueueInternals: () => void = () => undefined;

/**
 * Test-only: clears the module-level batching/retry state (pending queue,
 * scheduled flush/retry timers, per-asset attempt counts, terminal-failure
 * dedupe). Call from `beforeEach`/`afterEach` alongside `setState` so leftover
 * timers from one test can't bleed into the next.
 */
export const resetThumbnailStoreInternalsForTest = (): void => {
  resetThumbnailQueueInternals();
};

export const useThumbnailStore = create<ThumbnailStoreType>()(
  immer((set, get) => {
    let pendingAssetIds = new Set<number>();
    let assetFlushTimer: ReturnType<typeof setTimeout> | undefined;
    // Guards against overlapping flushes: a flush started while a previous one
    // is still awaiting its bulk request would re-issue overlapping batches and
    // reintroduce the 503 load-shedding this batching is meant to avoid.
    let isFlushing = false;
    // Tracks how many times each assetId has been retried so the backoff grows
    // and the per-asset budget is enforced across flushes. Cleared once an asset
    // reaches a final state (or exhausts its budget).
    const assetRetryAttempts = new Map<number, number>();
    // Retry rounds grouped by attempt level. All assets due for the same
    // attempt share one timer and flush together, so a batch of non-final
    // assets costs one bulk request per backoff tier instead of one per asset.
    const retryBucketsByLevel = new Map<number, Set<number>>();
    const retryTimersByLevel = new Map<number, ReturnType<typeof setTimeout>>();
    // Dedupes terminal-failure telemetry so a stuck tile reports to Sentry once
    // (not on every remount/retry). Cleared for an asset once it recovers.
    const reportedTerminalAssetIds = new Set<number>();

    // Emit a single deduped Sentry report when an asset gives up, so a systemic
    // thumbnails outage is distinguishable from isolated per-asset failures.
    const reportTerminalThumbnailFailure = (
      assetId: number,
      reason: string,
      errorStatus?: number,
      state?: ThumbnailResponseState,
    ): void => {
      if (reportedTerminalAssetIds.has(assetId)) {
        return;
      }
      reportedTerminalAssetIds.add(assetId);
      CaptureException(new Error(`Thumbnail fetch terminally failed for asset ${assetId}`), {
        assetId,
        context: 'thumbnailStore.flushAssetThumbnailQueue',
        errorStatus,
        reason,
        state,
      });
    };

    resetThumbnailQueueInternals = () => {
      if (assetFlushTimer !== undefined) {
        clearTimeout(assetFlushTimer);
        assetFlushTimer = undefined;
      }
      retryTimersByLevel.forEach((timer) => clearTimeout(timer));
      retryTimersByLevel.clear();
      retryBucketsByLevel.clear();
      pendingAssetIds = new Set<number>();
      isFlushing = false;
      assetRetryAttempts.clear();
      reportedTerminalAssetIds.clear();
    };

    const scheduleFlush = (): void => {
      if (assetFlushTimer === undefined) {
        assetFlushTimer = setTimeout(() => {
          // Mutual recursion: the debounced flush re-schedules retries which
          // re-arm this timer. The reference resolves at call time (post-init),
          // so the forward reference is safe.
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          flushAssetThumbnailQueue().catch((error) => {
            // Backstop only: per-batch failures are handled inside the flush.
            // Anything reaching here is unexpected, so surface it instead of
            // swallowing it silently.
            CaptureException(error, { context: 'thumbnailStore.flushAssetThumbnailQueue' });
          });
        }, ASSET_BATCH_DELAY_MS);
      }
    };

    // Re-enqueue an assetId after a backoff delay. Returns false when the retry
    // budget is exhausted so the caller can mark the asset terminally errored.
    //
    // Assets are bucketed by their next attempt level and share a single timer
    // per level: the first asset to reach a level arms the timer (with one
    // jittered delay for that tier), and every asset that reaches the same level
    // before it fires rides along and flushes in the same bulk request. This
    // keeps the per-asset backoff curve and budget intact while collapsing a
    // wave of non-final assets into one thumbnail call per tier instead of one
    // per asset.
    const scheduleAssetRetry = (assetId: number): boolean => {
      const attempts = assetRetryAttempts.get(assetId) ?? 0;
      if (attempts >= ASSET_MAX_RETRY_ATTEMPTS) {
        return false;
      }
      const nextAttempt = attempts + 1;
      assetRetryAttempts.set(assetId, nextAttempt);

      let bucket = retryBucketsByLevel.get(nextAttempt);
      if (bucket === undefined) {
        bucket = new Set<number>();
        retryBucketsByLevel.set(nextAttempt, bucket);
      }
      bucket.add(assetId);

      if (!retryTimersByLevel.has(nextAttempt)) {
        const delay = computeAssetRetryDelayMs(nextAttempt);
        const timer = setTimeout(() => {
          retryTimersByLevel.delete(nextAttempt);
          const due = retryBucketsByLevel.get(nextAttempt);
          retryBucketsByLevel.delete(nextAttempt);
          if (due === undefined || due.size === 0) {
            return;
          }
          due.forEach((id) => pendingAssetIds.add(id));
          scheduleFlush();
        }, delay);
        retryTimersByLevel.set(nextAttempt, timer);
      }
      return true;
    };

    const flushAssetThumbnailQueue = async (): Promise<void> => {
      assetFlushTimer = undefined;
      // A flush is already awaiting its bulk request. Leave the newly-enqueued
      // IDs in the pending set; the in-flight flush drains them on completion.
      if (isFlushing) {
        return;
      }
      if (pendingAssetIds.size === 0) {
        return;
      }
      // Drop any asset that's already resolved to a usable Completed image:
      // its result is immutable, so re-requesting it only adds load. This also
      // clears its stale retry bookkeeping. Done here (not just at enqueue) so
      // the guarantee holds regardless of how the id landed in the queue.
      const store = get();
      const idsToFetch = Array.from(pendingAssetIds).filter((id) => {
        if (isUsableCompletedThumbnail(store.thumbnailsByAssetId[id])) {
          assetRetryAttempts.delete(id);
          return false;
        }
        return true;
      });
      pendingAssetIds = new Set<number>();
      if (idsToFetch.length === 0) {
        return;
      }
      isFlushing = true;

      const batches: number[][] = [];
      for (let i = 0; i < idsToFetch.length; i += ASSET_BATCH_SIZE) {
        batches.push(idsToFetch.slice(i, i + ASSET_BATCH_SIZE));
      }

      try {
        await Promise.all(
          batches.map(async (batch) => {
            try {
              const { data: thumbnails } = await getThumbnailsByAssetIds(batch);

              // An asset is "not ready" when it has no row yet (freshly created /
              // AI-generated assets lag the pipeline), its row is in a non-final
              // state, or it reports `Completed` without a usable `imageUrl` (the
              // CDN URL hasn't been published yet). All of these get re-enqueued
              // with backoff; everything else is final.
              const retryableIds: number[] = [];
              set((draft) => {
                batch.forEach((id) => {
                  const matched = thumbnails.find(({ targetId }) => targetId === id);
                  const isCompletedWithoutUrl =
                    matched?.state === ThumbnailResponseState.Completed && !matched.imageUrl;
                  const isNotReady =
                    matched === undefined ||
                    (matched.state !== undefined && NonFinalThumbnailStates.has(matched.state)) ||
                    isCompletedWithoutUrl;

                  if (!isNotReady) {
                    assetRetryAttempts.delete(id);
                    reportedTerminalAssetIds.delete(id);
                    draft.thumbnailsByAssetId[id] = {
                      data: matched,
                      errorStatus: undefined,
                      isError: false,
                      isLoading: false,
                    };
                    return;
                  }

                  const canRetry = (assetRetryAttempts.get(id) ?? 0) < ASSET_MAX_RETRY_ATTEMPTS;
                  if (canRetry) {
                    retryableIds.push(id);
                    draft.thumbnailsByAssetId[id] = {
                      data: matched,
                      errorStatus: undefined,
                      isError: false,
                      isLoading: true,
                    };
                    return;
                  }
                  // Budget exhausted while still not ready — surface as an error so
                  // the UI can stop showing an indefinite spinner.
                  assetRetryAttempts.delete(id);
                  reportTerminalThumbnailFailure(
                    id,
                    isCompletedWithoutUrl ? 'completed-without-image-url' : 'non-final-state',
                    undefined,
                    matched?.state,
                  );
                  draft.thumbnailsByAssetId[id] = {
                    data: matched,
                    errorStatus: undefined,
                    isError: true,
                    isLoading: false,
                  };
                });
              });
              retryableIds.forEach(scheduleAssetRetry);
            } catch (error) {
              const errorStatus = getHttpStatusFromError(error);
              const retryable = isRetryableErrorStatus(errorStatus);

              const retryableIds: number[] = [];
              set((draft) => {
                batch.forEach((id) => {
                  const canRetry =
                    retryable && (assetRetryAttempts.get(id) ?? 0) < ASSET_MAX_RETRY_ATTEMPTS;
                  if (canRetry) {
                    retryableIds.push(id);
                    // Keep the prior data (if any) and stay in a loading state so
                    // consumers don't flip to a broken icon between retries.
                    const existing = draft.thumbnailsByAssetId[id];
                    draft.thumbnailsByAssetId[id] = {
                      data: existing?.data,
                      errorStatus,
                      isError: false,
                      isLoading: true,
                    };
                    return;
                  }
                  assetRetryAttempts.delete(id);
                  reportTerminalThumbnailFailure(id, 'http-error', errorStatus);
                  draft.thumbnailsByAssetId[id] = {
                    data: undefined,
                    errorStatus,
                    isError: true,
                    isLoading: false,
                  };
                });
              });
              retryableIds.forEach(scheduleAssetRetry);
            }
          }),
        );
      } finally {
        isFlushing = false;
        // Drain anything enqueued (new requests or scheduled retries) while this
        // flush was in flight.
        if (pendingAssetIds.size > 0) {
          scheduleFlush();
        }
      }
    };

    const enqueueAssetThumbnail = (assetId: number): void => {
      pendingAssetIds.add(assetId);
      scheduleFlush();
    };

    return {
      blobByAssetId: {},
      getThumbnail: async (universeId: number) => {
        const exitingThumbnail = get().thumbnailsByUniverseId[universeId];
        if (!exitingThumbnail || exitingThumbnail.isError) {
          set((draft) => {
            draft.thumbnailsByUniverseId[universeId] = GetEmptyRequestState<ThumbnailType>();
          });
          try {
            const { data: thumbnails } = await getThumbnailsByUniverseIds([universeId]);
            set((draft) => {
              draft.thumbnailsByUniverseId[universeId] = {
                data: thumbnails.find(({ targetId }) => targetId === universeId),
                isError: false,
                isLoading: false,
              };
            });
          } catch {
            set((draft) => {
              draft.thumbnailsByUniverseId[universeId] = {
                data: undefined,
                isError: true,
                isLoading: false,
              };
            });
          } finally {
            set((draft) => {
              draft.thumbnailsByUniverseId[universeId].isLoading = false;
            });
          }
        }
      },
      getThumbnailByAssetId: (assetId: number) => {
        // Skip assets that already resolved successfully or are mid-flight; the
        // store self-heals errored/non-final assets via its own backoff retries,
        // so a fresh caller (e.g. a remounted tile) only needs to (re)start the
        // fetch when there's no usable entry or the last attempt terminally
        // failed.
        const existingThumbnail = get().thumbnailsByAssetId[assetId];
        if (existingThumbnail && !existingThumbnail.isError) {
          return;
        }

        set((draft) => {
          draft.thumbnailsByAssetId[assetId] = GetEmptyRequestState<ThumbnailType>();
        });

        enqueueAssetThumbnail(assetId);
      },
      getThumbnailsBatch: async (universeIds: number[]) => {
        const idsToFetch = universeIds.filter((id) => {
          const existing = get().thumbnailsByUniverseId[id];
          return !existing || existing.isError;
        });
        if (idsToFetch.length === 0) {
          return;
        }

        set((draft) => {
          idsToFetch.forEach((id) => {
            draft.thumbnailsByUniverseId[id] = GetEmptyRequestState<ThumbnailType>();
          });
        });

        const BATCH_SIZE = 100;
        const batches: number[][] = [];
        for (let i = 0; i < idsToFetch.length; i += BATCH_SIZE) {
          batches.push(idsToFetch.slice(i, i + BATCH_SIZE));
        }

        await Promise.all(
          batches.map(async (batch) => {
            try {
              const { data: thumbnails } = await getThumbnailsByUniverseIds(batch);
              set((draft) => {
                batch.forEach((id) => {
                  draft.thumbnailsByUniverseId[id] = {
                    data: thumbnails.find(({ targetId }) => targetId === id),
                    isError: false,
                    isLoading: false,
                  };
                });
              });
            } catch {
              set((draft) => {
                batch.forEach((id) => {
                  draft.thumbnailsByUniverseId[id] = {
                    data: undefined,
                    isError: true,
                    isLoading: false,
                  };
                });
              });
            }
          }),
        );
      },
      previewUrlByAssetId: {},
      setBlobByAssetId: (assetId: number, blob: Blob) => {
        set((draft) => {
          draft.blobByAssetId[assetId] = blob;
        });
      },
      setPreviewUrlByAssetId: (assetId: number, previewUrl: string) => {
        set((draft) => {
          draft.previewUrlByAssetId[assetId] = previewUrl;
        });
      },
      thumbnailsByAssetId: {},
      thumbnailsByUniverseId: {},
    };
  }),
);

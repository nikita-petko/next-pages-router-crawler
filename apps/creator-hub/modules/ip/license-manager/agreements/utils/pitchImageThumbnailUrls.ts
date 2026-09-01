import {
  RobloxThumbnailsApisModelsThumbnailBatchRequestTypeEnum,
  RobloxWebResponsesThumbnailsThumbnailBatchResponseStateEnum,
} from '@rbx/client-thumbnails/v1';
import { AssetThumbnailSize, ThumbnailFormat } from '@rbx/thumbnails';
import postPitchImageThumbnailBatch from '../hooks/pitchImageThumbnailRequests';

// oxlint-disable-next-line no-underscore-dangle -- Swagger generated enum has underscore
export const PITCH_IMAGE_THUMBNAIL_SIZE: string = AssetThumbnailSize._768x432;
export const PITCH_IMAGE_THUMBNAIL_FORMAT: string = ThumbnailFormat.webp;
export const PITCH_IMAGE_THUMBNAIL_POLLING_BACKOFF_MS = [2_000, 5_000, 10_000, 20_000] as const;
export const PITCH_IMAGE_THUMBNAIL_POLLING_MAX_DURATION_MS = 60_000;

export type PitchImageThumbnailResult = {
  states: Map<number, RobloxWebResponsesThumbnailsThumbnailBatchResponseStateEnum>;
  urls: Map<number, string>;
};

export const getPitchImageThumbnailPollingDelay = (
  attempts: number,
  fetchFailureCount: number,
  remainingDurationMs: number,
): number | false => {
  if (remainingDurationMs <= 0) {
    return false;
  }

  const backoffIndex = Math.min(
    attempts + fetchFailureCount,
    PITCH_IMAGE_THUMBNAIL_POLLING_BACKOFF_MS.length - 1,
  );
  return Math.min(PITCH_IMAGE_THUMBNAIL_POLLING_BACKOFF_MS[backoffIndex], remainingDurationMs);
};

/**
 * Pending / in-review / temporarily unavailable thumbnails can still complete. Missing entries are
 * treated as transient so a delayed first payload can be retried until the polling cap.
 */
export const isTransientPitchImageThumbnailState = (
  state: RobloxWebResponsesThumbnailsThumbnailBatchResponseStateEnum | undefined,
): boolean =>
  state == null ||
  state === RobloxWebResponsesThumbnailsThumbnailBatchResponseStateEnum.Pending ||
  state === RobloxWebResponsesThumbnailsThumbnailBatchResponseStateEnum.InReview ||
  state === RobloxWebResponsesThumbnailsThumbnailBatchResponseStateEnum.TemporarilyUnavailable;

/**
 * Resolves pitch image asset IDs to contextual thumbnail URLs for a rights holder.
 *
 * The access context is required: these assets are creator-owned, so the thumbnails
 * batch request must carry the agreement permission.
 *
 * @returns URLs for thumbnails that are ready to display, plus the batch state for each asset.
 */
export const resolvePitchImageThumbnailUrls = async (
  assetIds: number[],
  accessContext: string,
): Promise<PitchImageThumbnailResult> => {
  const { data } = await postPitchImageThumbnailBatch({
    requests: Array.from(new Set(assetIds)).map((targetId) => ({
      targetId,
      type: RobloxThumbnailsApisModelsThumbnailBatchRequestTypeEnum.Asset,
      size: PITCH_IMAGE_THUMBNAIL_SIZE,
      format: PITCH_IMAGE_THUMBNAIL_FORMAT,
      isCircular: false,
      accessContext,
    })),
  });

  return (data ?? []).reduce<PitchImageThumbnailResult>(
    (acc, item) => {
      if (item.targetId == null) {
        return acc;
      }
      if (item.state != null) {
        acc.states.set(item.targetId, item.state);
      }
      if (
        item.imageUrl &&
        item.state === RobloxWebResponsesThumbnailsThumbnailBatchResponseStateEnum.Completed
      ) {
        acc.urls.set(item.targetId, item.imageUrl);
      }
      return acc;
    },
    { states: new Map(), urls: new Map() },
  );
};

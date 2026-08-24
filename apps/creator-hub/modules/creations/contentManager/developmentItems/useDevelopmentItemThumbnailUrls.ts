import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  RobloxWebResponsesThumbnailsThumbnailResponseStateEnum as ThumbnailResponseState,
  V1AssetsGetFormatEnum,
  V1AssetsGetReturnPolicyEnum,
  V1AssetsGetSizeEnum,
} from '@rbx/client-thumbnails/v1';
import type {
  RobloxWebResponsesThumbnailsThumbnailResponseStateEnum as ThumbnailResponseStateValue,
  RobloxWebWebAPIModelsApiArrayResponseRobloxWebResponsesThumbnailsThumbnailResponse as ThumbnailsResponse,
} from '@rbx/client-thumbnails/v1';
import { getThumbnailsClient } from '@rbx/thumbnails';

const EMPTY_THUMBNAIL_URLS: ReadonlyMap<number, string> = new Map();
const EMPTY_THUMBNAIL_STATES: ReadonlyMap<number, ThumbnailResponseStateValue> = new Map();
const EMPTY_ASSET_IDS: readonly number[] = [];
const THUMBNAIL_ASSET_IDS_PER_REQUEST = 50;
const THUMBNAIL_MAX_CONCURRENT_REQUESTS = 3;
const THUMBNAIL_STALE_TIME_MS = 5 * 60_000;
const PENDING_THUMBNAIL_POLLING_MAX_DURATION_MS = 60_000;
const PENDING_THUMBNAIL_POLLING_BACKOFF_MS = [2_000, 5_000, 10_000, 20_000] as const;

type DevelopmentItemThumbnailResult = {
  states: ReadonlyMap<number, ThumbnailResponseStateValue>;
  urls: ReadonlyMap<number, string>;
};

type PendingDevelopmentItemThumbnailPollingState = {
  attempts: number;
  completedUrls: ReadonlyMap<number, string>;
  pendingAssetIds: readonly number[];
  startedAt: number;
};

const EMPTY_THUMBNAIL_RESULT: DevelopmentItemThumbnailResult = {
  states: EMPTY_THUMBNAIL_STATES,
  urls: EMPTY_THUMBNAIL_URLS,
};

const isTransientThumbnailState = (state: ThumbnailResponseStateValue | undefined): boolean =>
  state == null ||
  state === ThumbnailResponseState.InReview ||
  state === ThumbnailResponseState.Pending ||
  state === ThumbnailResponseState.TemporarilyUnavailable;

export const getPendingDevelopmentItemThumbnailAssetIds = (
  assetIds: readonly number[],
  states: ReadonlyMap<number, ThumbnailResponseStateValue>,
): number[] => assetIds.filter((assetId) => isTransientThumbnailState(states.get(assetId)));

const getThumbnailBatches = (assetIds: readonly number[]): number[][] => {
  const batches: number[][] = [];
  for (let index = 0; index < assetIds.length; index += THUMBNAIL_ASSET_IDS_PER_REQUEST) {
    batches.push(assetIds.slice(index, index + THUMBNAIL_ASSET_IDS_PER_REQUEST));
  }
  return batches;
};

export const fetchDevelopmentItemThumbnails = async (
  assetIds: readonly number[],
  signal?: AbortSignal,
): Promise<DevelopmentItemThumbnailResult> => {
  if (assetIds.length === 0) {
    return EMPTY_THUMBNAIL_RESULT;
  }

  const thumbnailClient = getThumbnailsClient();
  const batches = getThumbnailBatches(assetIds);
  const responses: PromiseSettledResult<ThumbnailsResponse>[] = [];
  for (let index = 0; index < batches.length; index += THUMBNAIL_MAX_CONCURRENT_REQUESTS) {
    if (signal?.aborted === true) {
      break;
    }
    const requestWave = batches.slice(index, index + THUMBNAIL_MAX_CONCURRENT_REQUESTS);
    const waveResponses = await Promise.allSettled(
      requestWave.map((batch) =>
        thumbnailClient.getAssets(
          batch,
          V1AssetsGetReturnPolicyEnum.PlaceHolder,
          // eslint-disable-next-line no-underscore-dangle -- generated thumbnail sizes use API names
          V1AssetsGetSizeEnum._150x150,
          V1AssetsGetFormatEnum.Webp,
          false,
        ),
      ),
    );
    responses.push(...waveResponses);
  }

  const states = new Map<number, ThumbnailResponseStateValue>();
  const urls = new Map<number, string>();
  responses.forEach((response) => {
    if (response.status !== 'fulfilled') {
      return;
    }
    response.value.data?.forEach((thumbnail) => {
      if (thumbnail.targetId == null) {
        return;
      }
      if (thumbnail.state != null) {
        states.set(thumbnail.targetId, thumbnail.state);
      }
      if (thumbnail.imageUrl != null) {
        urls.set(thumbnail.targetId, thumbnail.imageUrl);
      }
    });
  });

  const failedResponse = responses.find((response) => response.status === 'rejected');
  if (failedResponse != null && responses.every((response) => response.status === 'rejected')) {
    throw failedResponse.reason;
  }

  return { states, urls };
};

export const fetchDevelopmentItemThumbnailUrls = async (
  assetIds: readonly number[],
  signal?: AbortSignal,
): Promise<ReadonlyMap<number, string>> => {
  const result = await fetchDevelopmentItemThumbnails(assetIds, signal);
  return result.urls;
};

export const usePendingDevelopmentItemThumbnailUrls = (
  assetIds: readonly number[],
  initialResult: DevelopmentItemThumbnailResult | undefined,
  initialStartedAt: number,
): ReadonlyMap<number, string> => {
  const queryClient = useQueryClient();
  const initialPendingAssetIds = useMemo(
    () =>
      initialResult == null
        ? EMPTY_ASSET_IDS
        : getPendingDevelopmentItemThumbnailAssetIds(assetIds, initialResult.states),
    [assetIds, initialResult],
  );
  const pollingQueryKey = useMemo(
    () => [
      'development-item-pending-thumbnail-urls-v1',
      initialResult == null ? 'waiting' : assetIds,
      initialStartedAt,
    ],
    [assetIds, initialResult, initialStartedAt],
  );
  const initialPollingState = useMemo<PendingDevelopmentItemThumbnailPollingState | undefined>(
    () =>
      initialResult == null
        ? undefined
        : {
            attempts: 0,
            completedUrls: EMPTY_THUMBNAIL_URLS,
            pendingAssetIds: initialPendingAssetIds,
            startedAt: initialStartedAt,
          },
    [initialPendingAssetIds, initialResult, initialStartedAt],
  );

  const pollingQuery = useQuery({
    queryKey: pollingQueryKey,
    queryFn: async ({ signal }) => {
      const previous =
        queryClient.getQueryData<PendingDevelopmentItemThumbnailPollingState>(pollingQueryKey) ??
        initialPollingState;
      if (previous == null) {
        throw new Error('Pending thumbnail polling started without initial thumbnail state.');
      }
      if (previous.pendingAssetIds.length === 0) {
        return previous;
      }

      const result = await fetchDevelopmentItemThumbnails(previous.pendingAssetIds, signal);
      const completedUrls = new Map(previous.completedUrls);
      previous.pendingAssetIds.forEach((assetId) => {
        if (result.states.get(assetId) !== ThumbnailResponseState.Completed) {
          return;
        }
        const completedUrl = result.urls.get(assetId);
        if (completedUrl != null) {
          completedUrls.set(assetId, completedUrl);
        }
      });

      return {
        attempts: previous.attempts + 1,
        completedUrls,
        pendingAssetIds: getPendingDevelopmentItemThumbnailAssetIds(
          previous.pendingAssetIds,
          result.states,
        ),
        startedAt: previous.startedAt,
      };
    },
    enabled: initialResult != null && initialPendingAssetIds.length > 0,
    initialData: initialPollingState,
    refetchInterval: (query) => {
      const pollingState = query.state.data;
      if (pollingState == null || pollingState.pendingAssetIds.length === 0) {
        return false;
      }

      const remainingDuration =
        PENDING_THUMBNAIL_POLLING_MAX_DURATION_MS - (Date.now() - pollingState.startedAt);
      if (remainingDuration <= 0) {
        return false;
      }

      const backoffIndex = Math.min(
        pollingState.attempts + query.state.fetchFailureCount,
        PENDING_THUMBNAIL_POLLING_BACKOFF_MS.length - 1,
      );
      return Math.min(PENDING_THUMBNAIL_POLLING_BACKOFF_MS[backoffIndex], remainingDuration);
    },
    refetchIntervalInBackground: false,
    retry: false,
    staleTime: Infinity,
  });

  return pollingQuery.data?.completedUrls ?? EMPTY_THUMBNAIL_URLS;
};

const useDevelopmentItemThumbnailUrls = (assetIds: readonly number[]) => {
  const stableAssetIds = useMemo(
    () => [...new Set(assetIds)].sort((left, right) => left - right),
    [assetIds],
  );
  const thumbnailQuery = useQuery({
    queryKey: ['development-item-thumbnail-results-v3', stableAssetIds],
    queryFn: ({ signal }) => fetchDevelopmentItemThumbnails(stableAssetIds, signal),
    enabled: stableAssetIds.length > 0,
    placeholderData: EMPTY_THUMBNAIL_RESULT,
    staleTime: THUMBNAIL_STALE_TIME_MS,
  });
  const completedPendingThumbnailUrls = usePendingDevelopmentItemThumbnailUrls(
    stableAssetIds,
    thumbnailQuery.isPlaceholderData ? undefined : thumbnailQuery.data,
    thumbnailQuery.dataUpdatedAt,
  );
  const thumbnailUrls = useMemo(() => {
    const urls = new Map(thumbnailQuery.data?.urls);
    completedPendingThumbnailUrls.forEach((url, assetId) => {
      urls.set(assetId, url);
    });
    return urls;
  }, [completedPendingThumbnailUrls, thumbnailQuery.data?.urls]);

  return { data: thumbnailUrls };
};

export default useDevelopmentItemThumbnailUrls;

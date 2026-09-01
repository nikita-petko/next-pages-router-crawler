import { useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isNonEmptyString } from '@modules/miscellaneous/utils';
import { GET_PITCH_IMAGE_THUMBNAIL_URLS_QUERY_KEY } from '../../queryKeys';
import {
  getPitchImageThumbnailPollingDelay,
  isTransientPitchImageThumbnailState,
  PITCH_IMAGE_THUMBNAIL_POLLING_MAX_DURATION_MS,
  resolvePitchImageThumbnailUrls,
  type PitchImageThumbnailResult,
} from '../utils/pitchImageThumbnailUrls';

interface UsePitchImageThumbnailUrlsQueryParams {
  assetIds?: number[];
  accessContext?: string;
}

type PitchImageThumbnailQueryData = PitchImageThumbnailResult & {
  attempts: number;
  polledSince: number;
};

interface PitchImageThumbnailQueryState {
  data: PitchImageThumbnailQueryData | undefined;
  fetchFailureCount: number;
  status: string;
}

const getPitchImageThumbnailRefetchInterval = (
  queryState: PitchImageThumbnailQueryState,
  assetIds: number[] | undefined,
  startedAt: number | undefined,
): number | false => {
  if (assetIds == null || startedAt == null) {
    return false;
  }

  const result = queryState.data;
  const remainingDurationMs =
    PITCH_IMAGE_THUMBNAIL_POLLING_MAX_DURATION_MS - (Date.now() - startedAt);
  const delay = (attempts: number) =>
    getPitchImageThumbnailPollingDelay(attempts, queryState.fetchFailureCount, remainingDurationMs);

  if (result == null) {
    return queryState.status === 'error' ? delay(0) : false;
  }

  const hasTransientThumbnail = assetIds.some((assetId) =>
    isTransientPitchImageThumbnailState(result.states.get(assetId)),
  );
  return hasTransientThumbnail ? delay(result.attempts) : false;
};

/**
 * Thumbnail URLs for pitch images the viewer reaches through an access context instead of
 * ownership.
 *
 * @returns completed thumbnail URLs keyed by asset id. Polls only while a thumbnail is in a
 * transient state, and stops after the polling cap.
 */
export const usePitchImageThumbnailUrlsQuery = ({
  assetIds,
  accessContext,
}: UsePitchImageThumbnailUrlsQueryParams) => {
  const queryClient = useQueryClient();
  const normalizedAssetIds =
    assetIds == null ? undefined : Array.from(new Set(assetIds)).sort((a, b) => a - b);
  const hasAssetIds = normalizedAssetIds != null && normalizedAssetIds.length > 0;
  const hasAccessContext = isNonEmptyString(accessContext);
  const queryKey = GET_PITCH_IMAGE_THUMBNAIL_URLS_QUERY_KEY(normalizedAssetIds, accessContext);
  const errorPollStartedAtRef = useRef<{ identity: string; startedAt: number } | undefined>(
    undefined,
  );
  const pollIdentity = `${normalizedAssetIds?.join(',') ?? ''}:${accessContext ?? ''}`;

  return useQuery({
    queryKey,
    queryFn: async (): Promise<PitchImageThumbnailQueryData> => {
      if (normalizedAssetIds == null || !isNonEmptyString(accessContext)) {
        throw new Error('Missing pitch image thumbnail request');
      }

      const resolved = await resolvePitchImageThumbnailUrls(normalizedAssetIds, accessContext);
      const previous = queryClient.getQueryData<PitchImageThumbnailQueryData>(queryKey);

      return {
        ...resolved,
        attempts: previous == null ? 0 : previous.attempts + 1,
        polledSince: previous?.polledSince ?? Date.now(),
      };
    },
    enabled: hasAssetIds && hasAccessContext,
    refetchInterval: (query) => {
      if (errorPollStartedAtRef.current?.identity !== pollIdentity) {
        errorPollStartedAtRef.current = undefined;
      }
      if (
        query.state.data == null &&
        query.state.status === 'error' &&
        errorPollStartedAtRef.current == null &&
        query.state.errorUpdatedAt > 0
      ) {
        errorPollStartedAtRef.current = {
          identity: pollIdentity,
          startedAt: query.state.errorUpdatedAt,
        };
      }

      return getPitchImageThumbnailRefetchInterval(
        query.state,
        normalizedAssetIds,
        query.state.data?.polledSince ?? errorPollStartedAtRef.current?.startedAt,
      );
    },
    refetchIntervalInBackground: false,
    staleTime: Infinity,
  });
};

export default usePitchImageThumbnailUrlsQuery;

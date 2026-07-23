import { captureMessage } from '@sentry/nextjs';
import { useQuery } from '@tanstack/react-query';
import type { Preview } from '@rbx/client-assets-upload-api/v1';
import { AssetType, ModerationState } from '@rbx/client-assets-upload-api/v1';
import assetsUploadApiClient, { FieldMask } from '@modules/clients/assetsupload';
import contentQualityClient from '@modules/clients/contentQuality';
import {
  VideoContentQualityReviewStatus,
  type VideoContentQualityReviewStatusValue,
} from '../utils/videoReviewStatusUtils';

const PREVIEW_DETAILS_FIELD_MASK_ARRAY = [FieldMask.ASSET_TYPE, FieldMask.MODERATION_RESULT];
const PREVIEWS_FIELD_MASK_ARRAY = [FieldMask.PREVIEWS];
const VIDEO_ASSET_TYPE = AssetType.GamePreviewVideo;

type GamePreviewVideoForPlace = {
  videoPreview: Preview | undefined;
  videoPreviewId: number | null;
  moderationState: ModerationState;
  videoContentQualityReviewStatus?: VideoContentQualityReviewStatusValue;
};

const emptyGamePreviewVideo: GamePreviewVideoForPlace = {
  videoPreview: undefined,
  videoPreviewId: null,
  moderationState: ModerationState.Unspecified,
};

export const getGamePreviewVideoForPlaceQueryKey = (
  placeId: number,
  universeId?: number,
  shouldFetchContentQuality?: boolean,
) => {
  return ['getGamePreviewVideoForPlace', placeId, universeId, shouldFetchContentQuality] as const;
};

const getPreviewAssetId = (preview: Preview) => {
  const assetNumber = preview.asset?.split('/')[1];
  return assetNumber ? Number(assetNumber) : undefined;
};

/**
 * Fetch content quality data for the video preview, and return
 * the video content quality review status from content quality.
 */
export const getVideoContentQualityReviewStatus = async (
  placeId: number,
  universeId: number,
  videoPreviewId: number,
): Promise<VideoContentQualityReviewStatusValue> => {
  try {
    const contentQualityResponse = await contentQualityClient.getThumbnailSignals(universeId, [
      videoPreviewId,
    ]);

    const videoSignal = contentQualityResponse.assetResults?.[String(videoPreviewId)];
    if (videoSignal?.isAuthenticVideo === true) {
      return VideoContentQualityReviewStatus.Passed;
    }
    if (videoSignal?.isAuthenticVideo === false) {
      return VideoContentQualityReviewStatus.Failed;
    }
  } catch (error) {
    captureMessage(
      `useGamePreviewVideoForPlaceQuery: Failed to fetch video content quality review data for place ${placeId}`,
      {
        level: 'error',
        extra: {
          error,
        },
      },
    );
    throw error;
  }

  return VideoContentQualityReviewStatus.Pending;
};

type UseGamePreviewVideoForPlaceQueryOptions = {
  shouldFetchContentQuality: boolean;
  enabled: boolean;
};

/**
 * Fetches the game preview video for a place via placeId, along with
 * moderation state, and video content quality review status when content quality is fetched.
 *
 * Set shouldFetchContentQuality to true and provide universeId to fetch
 * content quality data alongside the asset moderation state.
 */
const useGamePreviewVideoForPlaceQuery = (
  placeId: number,
  universeId: number | undefined,
  options: UseGamePreviewVideoForPlaceQueryOptions,
) => {
  const { enabled, shouldFetchContentQuality } = options;

  return useQuery({
    queryKey: getGamePreviewVideoForPlaceQueryKey(placeId, universeId, shouldFetchContentQuality),
    queryFn: async (): Promise<GamePreviewVideoForPlace> => {
      try {
        const data = await assetsUploadApiClient.getAsset(placeId, PREVIEWS_FIELD_MASK_ARRAY);
        const previews = data.previews ?? [];
        const previewIds = previews
          .map(getPreviewAssetId)
          .filter((previewId): previewId is number => previewId !== undefined);

        // Check each preview's asset type and fetch moderation status for video types.
        const previewAssetDetails = await Promise.all(
          previewIds.map(async (previewId) => {
            const assetDetails = await assetsUploadApiClient.getAsset(
              previewId,
              PREVIEW_DETAILS_FIELD_MASK_ARRAY,
            );
            return { previewId, assetDetails };
          }),
        );

        const gamePreviewVideoDetails = previewAssetDetails.find(({ assetDetails }) => {
          return assetDetails.assetType === VIDEO_ASSET_TYPE;
        });

        if (!gamePreviewVideoDetails) {
          return emptyGamePreviewVideo;
        }

        const assetModerationState =
          gamePreviewVideoDetails.assetDetails.moderationResult?.moderationState ??
          ModerationState.Unspecified;

        const videoContentQualityReviewStatus =
          shouldFetchContentQuality &&
          universeId !== undefined &&
          // Only fetch content quality if moderation approved the video
          assetModerationState === ModerationState.Approved
            ? await getVideoContentQualityReviewStatus(
                placeId,
                universeId,
                gamePreviewVideoDetails.previewId,
              )
            : undefined;

        return {
          videoPreview: previews.find((preview) => {
            return getPreviewAssetId(preview) === gamePreviewVideoDetails.previewId;
          }),
          videoPreviewId: gamePreviewVideoDetails.previewId,
          moderationState: assetModerationState,
          videoContentQualityReviewStatus,
        };
      } catch (error) {
        captureMessage(
          `useGamePreviewVideoForPlaceQuery: Failed to fetch preview video data for place ${placeId}`,
          {
            level: 'error',
            extra: {
              error,
            },
          },
        );
        throw error;
      }
    },
    enabled,
    staleTime: 0,
    refetchOnMount: 'always',
  });
};

export default useGamePreviewVideoForPlaceQuery;

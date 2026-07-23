import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { CheckAssetPermissionResult } from '@rbx/client-asset-permissions-api/v1';
import {
  ApiPermissionStatus,
  AssetConsumerAction,
  SubjectType,
} from '@rbx/client-asset-permissions-api/v1';
import { AssetType } from '@rbx/client-assets-upload-api/v1';
import type { RobloxApiDevelopModelsResponsePlaceMediaItemResponse } from '@rbx/client-develop/v1';
import assetPermissionsApiClient from '@modules/clients/assetPermissions';
import developClient from '@modules/clients/develop';
import type { Media } from '../types/Media';
import { MediaType } from '../types/Media';

export const getPlaceMediaQueryKey = (placeId: number) => ['getPlaceMedia', placeId] as const;

function isYoutubeVideo(placeMediaItem: RobloxApiDevelopModelsResponsePlaceMediaItemResponse) {
  return placeMediaItem.assetType === 'YouTubeVideo';
}

function isGamePreviewVideo(placeMediaItem: RobloxApiDevelopModelsResponsePlaceMediaItemResponse) {
  return placeMediaItem.assetType === AssetType.GamePreviewVideo;
}

const useGetPlaceMediaQuery = (placeId: number, userId: number) => {
  const select = useCallback(
    ({
      validMediaItems,
      assetPermissionChecks,
    }: {
      validMediaItems: RobloxApiDevelopModelsResponsePlaceMediaItemResponse[];
      assetPermissionChecks?: CheckAssetPermissionResult[] | null;
    }) => {
      const mediaList: Media[] =
        validMediaItems.map((item, index) => {
          const type = isYoutubeVideo(item) ? MediaType.Video : MediaType.Image;
          const allowedToUse =
            assetPermissionChecks?.[index]?.value?.status === ApiPermissionStatus.HasPermission;

          switch (type) {
            case MediaType.Image:
              return {
                id: item.imageId ?? 0,
                type,
                allowedToUse,
                altText: item.altText,
              };
            case MediaType.Video:
              return {
                id: item.videoAssetId ?? 0,
                type,
                videoTitle: item.videoTitle ?? '',
                videoHash: item.videoHash?.trim() ?? '',
                altText: item.altText,
                allowedToUse,
              };
            default: {
              const exhaustiveCheck: never = type;
              throw new Error(`Unhandled media type: ${String(exhaustiveCheck)}`);
            }
          }
        }) ?? [];
      return mediaList;
    },
    [],
  );

  return useQuery({
    queryKey: getPlaceMediaQueryKey(placeId),
    queryFn: async () => {
      const placeMediaItems = (await developClient.getPlaceMedia(placeId)).data;

      const validMediaItems = placeMediaItems?.filter((item) => {
        // Exclude game preview videos from PlaceMediaList; handled in a separate component.
        if (isGamePreviewVideo(item)) {
          return false;
        }
        if (isYoutubeVideo(item)) {
          return item.videoAssetId !== undefined;
        }
        return item.imageId !== undefined;
      });

      if (!validMediaItems?.length) {
        return { validMediaItems: [], assetPermissionChecks: [] };
      }

      // see https://roblox.slack.com/archives/CHGEFCAUT/p1715894730210749?thread_ts=1715638288.577109&cid=CHGEFCAUT
      // for why we need to check permissions for each asset
      // TLDR; useThumbnailImage hook will batch thumbnails request under the hood with v1/assets API. When one of the provided asset ids
      // denies permission, the whole batch request will fail and cause none of the thumbnails to be displayed. Until this bug mentioned in
      // the slack thread is fixed, we need to check permissions for each asset and only use useThumbnailImage hook for those that are allowed
      const assetPermissionChecks = await assetPermissionsApiClient.batchCheckAssetPermissions(
        validMediaItems.map((item) => {
          return {
            assetId: isYoutubeVideo(item) ? (item.videoAssetId ?? 0) : (item.imageId ?? 0),
            subject: SubjectType.User,
            subjectId: userId.toString(),
            permissionType: AssetConsumerAction.Use,
          };
        }),
      );

      return { validMediaItems, assetPermissionChecks };
    },
    select,
    enabled: !!placeId && !!userId,
  });
};

export default useGetPlaceMediaQuery;

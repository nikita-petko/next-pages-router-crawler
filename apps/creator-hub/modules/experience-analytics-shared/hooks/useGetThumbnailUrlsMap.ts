import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { RobloxWebResponsesThumbnailsThumbnailResponse } from '@rbx/client-thumbnails/v1';
import {
  V1AssetsGetFormatEnum,
  V1AssetsGetReturnPolicyEnum,
  V1AssetsGetSizeEnum,
} from '@rbx/client-thumbnails/v1';
import { getThumbnailsClient } from '@rbx/thumbnails';

const emptyMap = new Map<string, string>();

const useGetThumbnailUrlsMap = (assetIds: number[]) => {
  const select = useCallback(
    (data: RobloxWebResponsesThumbnailsThumbnailResponse[]): ReadonlyMap<string, string> => {
      if (data.length === 0) {
        return emptyMap;
      }
      return data.reduce((acc, curr) => {
        if (!curr.targetId || !curr.imageUrl) {
          return acc;
        }
        acc.set(curr.targetId.toString(), curr.imageUrl);
        return acc;
      }, new Map<string, string>());
    },
    [],
  );
  return useQuery({
    queryKey: ['thumbnailUrls', assetIds],
    queryFn: async () => {
      const thumbnailClient = getThumbnailsClient();
      const { data } = await thumbnailClient.getAssets(
        assetIds,
        V1AssetsGetReturnPolicyEnum.PlaceHolder,
        // eslint-disable-next-line no-underscore-dangle -- we need to access the value of the enum
        V1AssetsGetSizeEnum._768x432,
        V1AssetsGetFormatEnum.Webp,
        false,
      );
      return data ?? [];
    },
    initialData: [],
    select,
    enabled: assetIds.length > 0,
  });
};

export default useGetThumbnailUrlsMap;

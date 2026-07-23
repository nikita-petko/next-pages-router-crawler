import {
  RobloxThumbnailsApisModelsThumbnailBatchRequestTypeEnum,
  RobloxWebResponsesThumbnailsThumbnailResponse,
} from '@rbx/clients/thumbnails';
import { AssetThumbnailSize, getThumbnailsClient, ThumbnailFormat } from '@rbx/thumbnails';
import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

export const useGetThumbnailUrlsMap = (
  targetIds: number[],
  type: RobloxThumbnailsApisModelsThumbnailBatchRequestTypeEnum,
) => {
  const select = useCallback(
    (data: RobloxWebResponsesThumbnailsThumbnailResponse[]): ReadonlyMap<number, string> => {
      if (data.length === 0) {
        return new Map<number, string>();
      }
      return data.reduce((acc, curr, index) => {
        const targetId = targetIds[index];
        if (targetId == null || !curr.imageUrl) {
          return acc;
        }
        acc.set(targetId, curr.imageUrl);
        return acc;
      }, new Map<number, string>());
    },
    [targetIds],
  );
  return useQuery({
    queryKey: ['thumbnailUrls', targetIds],
    queryFn: async () => {
      try {
        const thumbnailClient = getThumbnailsClient();
        const { data } = await thumbnailClient.getBatchThumbnails(
          targetIds,
          type,
          // eslint-disable-next-line no-underscore-dangle -- we need to access the value of the enum
          AssetThumbnailSize._150x150,
          ThumbnailFormat.webp,
          false,
        );
        return data ?? [];
      } catch {
        return [];
      }
    },
    initialData: [],
    select,
    enabled: typeof window !== 'undefined' && targetIds.length > 0,
  });
};

export default useGetThumbnailUrlsMap;

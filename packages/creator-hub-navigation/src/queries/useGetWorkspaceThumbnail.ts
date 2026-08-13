import type { UseQueryResult } from '@tanstack/react-query';
import { skipToken, useQuery } from '@tanstack/react-query';
import type { ThumbnailTypes } from '@rbx/thumbnails';
import { ThumbnailClient } from '@rbx/thumbnails';

export const getWorkspaceThumbnailQueryKey = (thumbnailType: ThumbnailTypes, targetId: number) =>
  ['workspaceThumbnail', thumbnailType, targetId] as const;

const useGetWorkspaceThumbnail = (
  thumbnailType: ThumbnailTypes,
  targetId: number,
): UseQueryResult<string | null> =>
  useQuery({
    queryKey: getWorkspaceThumbnailQueryKey(thumbnailType, targetId),
    queryFn:
      targetId > 0
        ? async () =>
            (await ThumbnailClient.getThumbnailImage(thumbnailType, targetId)).imageUrl ?? null
        : skipToken,
    retry: false,
    staleTime: Infinity,
  });

export default useGetWorkspaceThumbnail;

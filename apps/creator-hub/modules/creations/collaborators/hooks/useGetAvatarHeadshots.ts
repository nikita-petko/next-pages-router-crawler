import { useQuery } from '@tanstack/react-query';
import { V1AssetsGetFormatEnum } from '@rbx/client-thumbnails/v1';
import { AvatarHeadshotSize, getThumbnailsClient } from '@rbx/thumbnails';

const useGetAvatarHeadshots = (userIds: Array<number>) => {
  return useQuery({
    queryKey: ['getAvatarHeadshots', userIds],
    queryFn: () =>
      getThumbnailsClient().getAvatarHeadshots(
        userIds,
        // oxlint-disable-next-line no-underscore-dangle -- This is an imported enum, outside of the scope of this component
        AvatarHeadshotSize._150x150,
        V1AssetsGetFormatEnum.Webp,
        true,
      ),
    enabled: userIds.length > 0,
  });
};

export default useGetAvatarHeadshots;

import thumbnailsClient from '@services/thumbnails/thumbnailsClient';
import { ThumbnailType } from '@type/thumbnail';

export const getThumbnailsByUniverseIds = async (universeIds: number[]) => {
  const response = await thumbnailsClient.get<{ data: ThumbnailType[] }>({
    url: `/games/icons?universeIds=${universeIds.join(',')}&returnPolicy=PlaceHolder&size=256x256&format=Png&isCircular=false`,
  });

  return response.data;
};

export const getThumbnailsByAssetIds = async (assetIds: number[]) => {
  const response = await thumbnailsClient.get<{ data: ThumbnailType[] }>({
    url: `/assets?assetIds=${assetIds.join(',')}&returnPolicy=PlaceHolder&size=768x432&format=Png&isCircular=false`,
  });

  return response.data;
};

export const getUserAvatarHeadshots = async (userIds: number[]) => {
  const response = await thumbnailsClient.get<{ data: ThumbnailType[] }>({
    url: `/users/avatar-headshot?userIds=${userIds.join(',')}&returnPolicy=PlaceHolder&size=48x48&format=Png&isCircular=true`,
  });

  return response.data;
};

export const getThumbnailByAssetId = async (assetId: number) => getThumbnailsByAssetIds([assetId]);

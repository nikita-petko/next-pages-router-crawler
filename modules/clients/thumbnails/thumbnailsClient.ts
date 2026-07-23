import { Fetch } from '@modules/clients/ads/adsClient';
import { GetSitetestBaseUrl } from '@utils/url';

const fetchClient = new Fetch();

export const getImageThumbnail = async (assetId: number) => {
  return fetchClient.get(
    `https://thumbnails.${GetSitetestBaseUrl()}/v1/assets?assetIds=${assetId}&returnPolicy=PlaceHolder&size=768x432&format=Png&isCircular=false`,
  );
};

export const getImageThumbnails = async (assetIds: number[]) => {
  const assetIdsString = assetIds.join(',');
  return fetchClient.get(
    `https://thumbnails.${GetSitetestBaseUrl()}/v1/assets?assetIds=${assetIdsString}&returnPolicy=PlaceHolder&size=768x432&format=Png&isCircular=false`,
  );
};

export const getGameThumbnailByPlaceId = async (placeId: number) => {
  return fetchClient.get(
    `https://thumbnails.${GetSitetestBaseUrl()}/v1/places/gameicons?placeIds=${placeId}&returnPolicy=PlaceHolder&size=256x256&format=Png&isCircular=false`,
  );
};

export const getGameThumbnailByUniverseId = async (universeId: number) => {
  return fetchClient.get(
    `https://thumbnails.${GetSitetestBaseUrl()}/v1/games/icons?universeIds=${universeId}&returnPolicy=PlaceHolder&size=256x256&format=Png&isCircular=false`,
  );
};

export const getGameThumbnailsByUniverseIds = async (universeIds: number[]) => {
  const universeIdsString = universeIds.join(',');
  return fetchClient.get(
    `https://thumbnails.${GetSitetestBaseUrl()}/v1/games/icons?universeIds=${universeIdsString}&returnPolicy=PlaceHolder&size=256x256&format=Png&isCircular=false`,
  );
};

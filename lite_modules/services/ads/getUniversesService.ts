import {
  SearchCreatorType,
  SearchSortParameter,
  SortOrder,
  Surface,
} from '@rbx/client-universes-api/v1';

import adsClient from '@clients/ads';
import gamesClient from '@clients/games';
import { universesSearchClient } from '@clients/universes';
import {
  AdvertisedUniverse,
  GetUniversesResponse,
  ListAdvertisedUniversesResponse,
  ListUniversesCanAdvertiseResponse,
} from '@type/universe';

const OWNED_UNIVERSES_PAGE_SIZE = 800;

export interface SearchOwnedUniversesParams {
  creatorTargetId: number;
  creatorType: SearchCreatorType;
}

export interface ListUniverseOptionsForAdCreationParams {
  creatorTargetId: number;
  creatorType: SearchCreatorType;
}

export const searchOwnedUniverses = async ({
  creatorTargetId,
  creatorType,
}: SearchOwnedUniversesParams): Promise<AdvertisedUniverse[]> => {
  const response = await universesSearchClient.searchSearchUniverses({
    creatorTargetId,
    creatorType,
    isArchived: false,
    pageSize: OWNED_UNIVERSES_PAGE_SIZE,
    sortOrder: SortOrder.Desc,
    sortParam: SearchSortParameter.LastUpdated,
    surface: Surface.CreatorHubCreations,
  });

  return (
    response.data
      ?.filter((universe) => universe.id !== undefined)
      .map((universe) => ({
        universe_id: universe.id as number,
        universe_name: universe.name ?? '',
      })) ?? []
  );
};

export const listAdvertisedUniverses = async () => {
  const response = await adsClient.get<ListAdvertisedUniversesResponse>({
    url: '/v2/native/advertisedUniverses',
  });
  return response.data;
};

export const listUniversesCanAdvertise = async () => {
  const response = await adsClient.get<ListUniversesCanAdvertiseResponse>({
    url: '/v1/universes',
  });
  return response.data;
};

export const listUniverseOptionsForAdCreation = async (
  params?: ListUniverseOptionsForAdCreationParams,
): Promise<AdvertisedUniverse[]> => {
  const universesCanAdvertiseResponse = await listUniversesCanAdvertise();
  const universesCanAdvertise = universesCanAdvertiseResponse.universes ?? [];

  if (params === undefined) {
    return universesCanAdvertise;
  }

  const groupOwnedUniverses = await searchOwnedUniverses({
    creatorTargetId: params.creatorTargetId,
    creatorType: params.creatorType,
  });

  const advertisableUniverseIds = new Set(
    universesCanAdvertise.map((universe) => universe.universe_id),
  );
  return groupOwnedUniverses.filter((universe) =>
    advertisableUniverseIds.has(universe.universe_id),
  );
};

export const getUniverses = async (universeIds: number[]): Promise<GetUniversesResponse> => {
  const universeIdParam = universeIds.join(',');
  const getUniversesResponse = await gamesClient.get<GetUniversesResponse>({
    url: `/games?universeIds=${universeIdParam}`,
  });

  return getUniversesResponse.data;
};

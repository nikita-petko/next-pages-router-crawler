import {
  SearchCreatorType,
  SearchSortParameter,
  SortOrder,
  Surface,
} from '@rbx/client-universes-api/v1';

import adsClient from '@clients/ads';
import gamesClient from '@clients/games';
import { universesSearchClient } from '@clients/universes';
import { listPublisherEligibleUniverses } from '@services/ads/adIntegrationCampaignService';
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

const intersectOwnedUniverses = async (
  universes: AdvertisedUniverse[],
  params?: ListUniverseOptionsForAdCreationParams,
): Promise<AdvertisedUniverse[]> => {
  if (params === undefined) {
    return universes;
  }

  const ownedUniverses = await searchOwnedUniverses({
    creatorTargetId: params.creatorTargetId,
    creatorType: params.creatorType,
  });
  const eligibleUniverseIds = new Set(universes.map((universe) => universe.universe_id));
  return ownedUniverses.filter((universe) => eligibleUniverseIds.has(universe.universe_id));
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

  return intersectOwnedUniverses(universesCanAdvertise, params);
};

export interface AdIntegrationUniverseOptions {
  publisherEligibleUniverseIds: number[];
  universes: AdvertisedUniverse[];
}

export const listUniverseOptionsForAdIntegrations = async (
  params?: ListUniverseOptionsForAdCreationParams,
): Promise<AdIntegrationUniverseOptions> => {
  const publisherEligibleUniversesResponse = await listPublisherEligibleUniverses();
  const publisherEligibleUniverses = publisherEligibleUniversesResponse.universes ?? [];
  const publisherEligibleUniverseIds = publisherEligibleUniverses.map(
    (universe) => universe.universe_id,
  );

  if (params === undefined) {
    return {
      publisherEligibleUniverseIds,
      universes: publisherEligibleUniverses,
    };
  }

  const ownedUniverses = await searchOwnedUniverses({
    creatorTargetId: params.creatorTargetId,
    creatorType: params.creatorType,
  });

  return {
    publisherEligibleUniverseIds,
    universes: ownedUniverses,
  };
};

export const getUniverses = async (universeIds: number[]): Promise<GetUniversesResponse> => {
  const universeIdParam = universeIds.join(',');
  const getUniversesResponse = await gamesClient.get<GetUniversesResponse>({
    url: `/games?universeIds=${universeIdParam}`,
  });

  return getUniversesResponse.data;
};

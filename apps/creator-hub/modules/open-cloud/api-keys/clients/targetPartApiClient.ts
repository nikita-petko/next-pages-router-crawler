import type { UniverseModel } from '@rbx/client-universes-api/v1';
import { SearchSortParameter, Surface } from '@rbx/client-universes-api/v1';
import { SortOrder } from '@rbx/core';
import datastoresClient from '@modules/clients/datastores';
import developApi from '@modules/clients/develop';
import type { V1SearchUniversesRequest } from '@modules/clients/universes';
import universesClient from '@modules/clients/universes';
import type TargetPartApiData from '../interfaces/TargetPartApiData';
import type TargetPartApiListData from '../interfaces/TargetPartApiListData';
import type { GetTargetsParameters } from '../interfaces/TargetPartConfiguration';

// universe list endpoint
const getUniverses = async (parameters: GetTargetsParameters): Promise<TargetPartApiListData> => {
  const { creatorType, creatorTargetId, queryString, limit } = parameters;

  const searchRequest: V1SearchUniversesRequest = {
    search: queryString,
    creatorType,
    creatorTargetId,
    isArchived: false,
    isPublic: undefined,
    sortOrder: SortOrder.Desc,
    sortParam: SearchSortParameter.GameCreated,
    surface: Surface.CreatorHubOpenCloud,
    pageSize: limit,
  };
  const response = await universesClient.searchUniverses(searchRequest);

  const { data } = response;

  const cursorString = ((response.nextResultIndex ?? 0) / (limit ?? 10))?.toString();
  const nextPageCursor = response.nextResultIndex ? cursorString : undefined;

  return {
    nextPageCursor,
    data: data?.map((universe: UniverseModel) => ({
      name: universe.name ?? undefined,
      id: universe.id,
    })),
  };
};

// universe details endpoint
const getUniverse = async (id: number): Promise<TargetPartApiData> => {
  const universeDetails = await developApi.getUniverseDetails(id);
  return {
    name: universeDetails.name,
  };
};

// datastores list endpoint
const getDatastores = async (parameters: GetTargetsParameters): Promise<TargetPartApiListData> => {
  const { parentTargetId, limit, cursor, queryString } = parameters;

  const response = await datastoresClient.listDatastores(
    parentTargetId ?? 0,
    limit,
    cursor,
    queryString,
  );
  return {
    nextPageCursor: response.nextPageCursor === '' ? undefined : response.nextPageCursor,
    data: response.datastores.map((datastoreEntry) => {
      return { name: datastoreEntry.name };
    }),
  };
};

export default {
  getUniverse,
  getUniverses,
  getDatastores,
};

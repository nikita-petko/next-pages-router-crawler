import {
  Surface,
  type SearchCreatorType,
  type SearchSearchUniversesRequest,
  type SortOrder,
} from '@rbx/client-universes-api/v1';
import { areUniversesImpacted } from '@modules/clients/teamCreateCollaboration';
import universesClient from '@modules/clients/universes';
import { Asset } from '@modules/miscellaneous/common';
import type { AssetSorts } from '../../common/interfaces/CreationsFilters';

export interface ScoutPagingParameters {
  assetType: Asset;
  creatorType: SearchCreatorType;
  creatorTargetId: number;
  isPublicOnly?: boolean;
  isArchived?: boolean;
  isAgeRestrictedCollaboration?: boolean;
  sort: AssetSorts;
  sortOrder: SortOrder;
  count?: number;
  cursor?: string;
}

export interface ImpactScoutPageResult {
  anyImpacted: boolean;
  nextPageCursor: string | undefined;
}

export default async function loadImpactScoutPage(
  params: ScoutPagingParameters,
): Promise<ImpactScoutPageResult> {
  const searchRequest: SearchSearchUniversesRequest = {
    search: undefined,
    creatorType: params.creatorType,
    creatorTargetId: params.creatorTargetId,
    isArchived: params.isArchived,
    isPublic: params.isPublicOnly ? true : undefined,
    sortOrder: params.sortOrder,
    sortParam: params.sort[Asset.Place],
    pageSize: params.count,
    surface: Surface.CreatorHubCreations,
    pageIndex: params.cursor ? Number.parseInt(params.cursor, 10) : undefined,
    needsAssetOptions: true,
  };

  const response = await universesClient.searchUniverses(searchRequest);

  const universeIds =
    response.data
      ?.map((u) => u.id)
      .filter((id): id is number => typeof id === 'number' && id !== 0) ?? [];

  const cursorString = ((response.nextResultIndex ?? 0) / (params.count ?? 10)).toString();
  const nextPageCursor = response.nextResultIndex ? cursorString : undefined;

  if (universeIds.length === 0) {
    return { anyImpacted: false, nextPageCursor };
  }

  const result = await areUniversesImpacted(universeIds);
  const anyImpacted = universeIds.some((id) => result[id]?.IsImpacted);
  return { anyImpacted, nextPageCursor };
}

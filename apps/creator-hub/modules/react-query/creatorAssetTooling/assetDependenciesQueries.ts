import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { AssetDependenciesChildFilter } from '@rbx/client-creator-asset-tooling-api/v1';
import creatorAssetToolingClient from '@modules/clients/creatorAssetTooling';

const KEY_PREFIX = 'creatorAssetTooling_';

export type AssetDependenciesFilter = AssetDependenciesChildFilter;

function getAssetDependenciesQueryKey(
  sourceAssetId: number,
  sourceAssetVersionNumber: number | undefined,
  pageSize: number,
  pageToken: string | undefined,
  filter: AssetDependenciesFilter | undefined,
) {
  return [
    `${KEY_PREFIX}getAssetDependencies`,
    sourceAssetId,
    sourceAssetVersionNumber,
    pageSize,
    pageToken,
    filter,
  ] as const;
}

export function useGetAssetDependencies(
  sourceAssetId: number,
  sourceAssetVersionNumber: number | undefined,
  pageSize: number,
  pageToken: string | undefined,
  filter: AssetDependenciesFilter | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: getAssetDependenciesQueryKey(
      sourceAssetId,
      sourceAssetVersionNumber,
      pageSize,
      pageToken,
      filter,
    ),
    queryFn: () =>
      creatorAssetToolingClient.getAssetDependencies({
        sourceAssetId,
        sourceAssetVersionNumber,
        pageSize,
        pageToken,
        filter,
      }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

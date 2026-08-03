import { keepPreviousData, useQuery } from '@tanstack/react-query';
import creatorAssetToolingClient from '@modules/clients/creatorAssetTooling';

const KEY_PREFIX = 'creatorAssetTooling_';

function getAssetDependenciesQueryKey(
  sourceAssetId: number,
  sourceAssetVersionNumber: number | undefined,
  pageSize: number,
  pageToken: string | undefined,
) {
  return [
    `${KEY_PREFIX}getAssetDependencies`,
    sourceAssetId,
    sourceAssetVersionNumber,
    pageSize,
    pageToken,
  ] as const;
}

// TODO: This query is not currently in use. It will be used in STM-9203 to paginate through the asset dependencies.
export function useGetAssetDependencies(
  sourceAssetId: number,
  sourceAssetVersionNumber: number | undefined,
  pageSize: number,
  pageToken: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: getAssetDependenciesQueryKey(
      sourceAssetId,
      sourceAssetVersionNumber,
      pageSize,
      pageToken,
    ),
    queryFn: () =>
      creatorAssetToolingClient.getAssetDependencies({
        sourceAssetId,
        sourceAssetVersionNumber,
        pageSize,
        pageToken,
      }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

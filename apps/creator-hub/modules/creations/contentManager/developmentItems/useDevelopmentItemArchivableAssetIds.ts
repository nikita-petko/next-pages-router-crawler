import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import fetchDevelopmentItemAssetDetails from './fetchDevelopmentItemAssetDetails';

const ARCHIVE_ELIGIBILITY_STALE_TIME_MS = 30_000;
const EMPTY_ARCHIVABLE_ASSET_IDS: ReadonlySet<number> = new Set();

const useDevelopmentItemArchivableAssetIds = (assetIds: readonly number[]) => {
  const stableAssetIds = useMemo(
    () => [...new Set(assetIds)].sort((left, right) => left - right),
    [assetIds],
  );

  return useQuery<ReadonlySet<number>>({
    queryKey: ['development-item-archivable-asset-ids', stableAssetIds],
    queryFn: async ({ signal }) => {
      const assetDetails = await fetchDevelopmentItemAssetDetails(stableAssetIds, signal);
      return assetDetails.reduce((archivableAssetIds, asset) => {
        if (asset.id != null && asset.isArchivable === true) {
          archivableAssetIds.add(asset.id);
        }
        return archivableAssetIds;
      }, new Set<number>());
    },
    enabled: stableAssetIds.length > 0,
    placeholderData: EMPTY_ARCHIVABLE_ASSET_IDS,
    staleTime: ARCHIVE_ELIGIBILITY_STALE_TIME_MS,
  });
};

export default useDevelopmentItemArchivableAssetIds;

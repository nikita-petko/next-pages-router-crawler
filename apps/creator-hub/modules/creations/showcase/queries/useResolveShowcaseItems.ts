import { useMutation } from '@tanstack/react-query';
import showcaseDataSource from '../data/showcaseDataSource';
import type { ResolvedShowcaseItem } from '../types';

type ResolveVariables = {
  assetIds: number[];
  /** Ids already selected or already in the showcase, so duplicates are rejected (FR-C2.4.1). */
  existingAssetIds: number[];
};

/** Turns hand-entered asset ids into items, reporting per-id rejections. */
export function useResolveShowcaseItems(communityId: number | undefined) {
  return useMutation<ResolvedShowcaseItem[], Error, ResolveVariables>({
    mutationFn: ({ assetIds, existingAssetIds }) =>
      showcaseDataSource.resolveItemsByAssetId(communityId ?? 0, assetIds, existingAssetIds),
  });
}

export default useResolveShowcaseItems;

import { useMutation, useQueryClient } from '@tanstack/react-query';
import showcaseDataSource from '../data/showcaseDataSource';
import type { Showcase, ShowcaseDraft } from '../types';
import { showcaseKeys } from './constants';

export function useCreateShowcase(communityId: number | undefined) {
  const queryClient = useQueryClient();

  return useMutation<Showcase, Error, ShowcaseDraft>({
    mutationFn: (draft) => showcaseDataSource.createShowcase(communityId ?? 0, draft),
    onSuccess: async () => {
      // Publishing consumes quota, so both the list and the quota readout go stale.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: showcaseKeys.byCommunity(communityId ?? 0) }),
        queryClient.invalidateQueries({ queryKey: showcaseKeys.quota(communityId ?? 0) }),
      ]);
    },
  });
}

export default useCreateShowcase;

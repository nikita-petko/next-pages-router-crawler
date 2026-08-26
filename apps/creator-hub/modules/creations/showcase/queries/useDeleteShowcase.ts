import { useMutation, useQueryClient } from '@tanstack/react-query';
import showcaseDataSource from '../data/showcaseDataSource';
import { showcaseKeys } from './constants';

export function useDeleteShowcase(communityId: number | undefined) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (showcaseId) => showcaseDataSource.deleteShowcase(showcaseId),
    onSuccess: async (_data, showcaseId) => {
      queryClient.removeQueries({ queryKey: showcaseKeys.detail(showcaseId) });
      // Quota is intentionally not invalidated: taking a showcase down does not
      // refund the publish it consumed.
      await queryClient.invalidateQueries({
        queryKey: showcaseKeys.byCommunity(communityId ?? 0),
      });
    },
  });
}

export default useDeleteShowcase;

import { useMutation, useQueryClient } from '@tanstack/react-query';
import rightsClient from '@modules/clients/rights';
import { listMatchesKey } from './useListMatches';

export type BatchArchiveMatchesData = {
  accountId: string;
  matchIds: string[];
  rationale?: string;
  removeConsequences?: boolean;
};

export default function useBatchArchiveMatches(onSuccess?: () => void, onError?: () => void) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: BatchArchiveMatchesData) =>
      rightsClient.batchArchiveMatches(
        data.accountId,
        data.matchIds,
        data.rationale,
        data.removeConsequences,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [listMatchesKey] });
      onSuccess?.();
    },
    onError: () => {
      onError?.();
    },
  });

  return mutation;
}

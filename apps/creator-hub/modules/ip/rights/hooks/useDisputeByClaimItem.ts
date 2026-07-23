import { rightsClient } from '@modules/clients';
import { useQuery } from '@tanstack/react-query';

export const disputeKey = 'rightsClient/disputeByClaimItem';

export default function useDisputeByClaimItem(accountId?: string, claimItemId?: string) {
  const response = useQuery({
    queryKey: [disputeKey, claimItemId, accountId],
    queryFn: async () => {
      return rightsClient.getDisputeByClaimItem(accountId ?? '', claimItemId ?? '');
    },
    enabled: !!accountId && !!claimItemId,
  });

  const dispute = response.data;
  return { dispute, ...response };
}

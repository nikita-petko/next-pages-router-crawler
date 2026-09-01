import { useQuery } from '@tanstack/react-query';
import rightsClient from '@modules/clients/rights';

export const claimItemsKey = 'rightsClient/claimItem';

export default function useClaimItem(accountId?: string, claimId?: string, claimItemId?: string) {
  const response = useQuery({
    queryKey: [claimItemsKey, claimItemId],
    queryFn: async () => {
      return rightsClient.getClaimItem(accountId ?? '', claimId ?? '', claimItemId ?? '');
    },
    enabled: !!accountId && !!claimId && !!claimItemId,
  });

  const claimItem = response.data;
  return { claimItem, ...response };
}

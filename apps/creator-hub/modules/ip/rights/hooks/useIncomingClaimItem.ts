import { rightsClient } from '@modules/clients';
import { useQuery } from '@tanstack/react-query';

export const claimItemsKey = 'rightsClient/incomingClaimItem';

export default function useIncomingClaimItem(accountId?: string, claimItemId?: string) {
  const response = useQuery({
    queryKey: [claimItemsKey, claimItemId],
    queryFn: async () => {
      return rightsClient.getIncomingClaimItem(accountId ?? '', claimItemId ?? '');
    },
    enabled: !!accountId && !!claimItemId,
  });

  const claimItem = response.data;
  return { claimItem, ...response };
}

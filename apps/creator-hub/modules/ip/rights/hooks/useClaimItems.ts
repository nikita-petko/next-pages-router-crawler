import { rightsClient } from '@modules/clients';
import { useQuery } from '@tanstack/react-query';

export const claimItemsKey = 'rightsClient/claimItems';

export default function useClaimItems(accountId?: string, claimId?: string) {
  const response = useQuery({
    queryKey: [claimItemsKey, claimId],
    queryFn: async () => {
      return rightsClient.listClaimItems(accountId ?? '', claimId ?? '');
    },
  });

  const claimItems = response.data?.claimItems || [];
  return { claimItems, ...response };
}

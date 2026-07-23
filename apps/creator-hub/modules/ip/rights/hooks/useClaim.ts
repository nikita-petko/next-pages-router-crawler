import { rightsClient } from '@modules/clients';
import { useQuery } from '@tanstack/react-query';

export const claimItemsKey = 'rightsClient/useClaim';

export default function useClaim(claimId: string, accountId?: string) {
  const response = useQuery({
    queryKey: [claimItemsKey, claimId],
    queryFn: async () => {
      return rightsClient.getClaim(accountId ?? '', claimId);
    },
    enabled: !!accountId && !!claimId,
  });

  const claim = response.data;
  return { claim, ...response };
}

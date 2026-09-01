import { useQuery } from '@tanstack/react-query';
import rightsClient from '@modules/clients/rights';
import { is403Error } from './useClaimItemView';

export const claimItemMetadataKey = 'rightsClient/claimItemMetadata';

export const useClaimItemMetadata = (
  accountId: string,
  claimItemId: string,
  enabled: boolean = true,
) => {
  const response = useQuery({
    queryKey: [claimItemMetadataKey, accountId, claimItemId],
    queryFn: async () => {
      return rightsClient.getClaimItemMetadata(accountId ?? '', claimItemId);
    },
    enabled: enabled && !!accountId && !!claimItemId,
    retry: (failureCount, error) => {
      if (is403Error(error)) {
        return false;
      }
      return failureCount < 3;
    },
  });

  return {
    metadata: response.data?.contents || [],
    ...response,
  };
};
export default useClaimItemMetadata;

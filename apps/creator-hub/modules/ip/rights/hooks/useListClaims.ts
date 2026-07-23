import { useQuery, keepPreviousData } from '@tanstack/react-query';
import rightsClient from '@modules/clients/rights';

export const listClaimsKey = 'rightsClient/listClaimsPaginated';

export const useListClaims = (accountId: string, pageSize: number, pageToken: string) => {
  const response = useQuery({
    queryKey: [listClaimsKey, pageSize, pageToken],
    queryFn: async () => {
      return rightsClient.listClaims(accountId ?? '', pageSize, pageToken);
    },
    placeholderData: keepPreviousData,
  });

  return {
    claims: response.data?.claims || [],
    nextPageToken: response.data?.nextPageToken || '',
    ...response,
  };
};
export default useListClaims;

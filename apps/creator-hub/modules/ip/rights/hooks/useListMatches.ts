import { useQuery } from '@tanstack/react-query';
import rightsClient from '@modules/clients/rights';

export const listMatchesKey = 'rightsClient/listMatchesPaginated';

export const useListMatches = (accountId: string, pageSize: number, pageToken: string) => {
  const response = useQuery({
    queryKey: [listMatchesKey, accountId, pageSize, pageToken],
    queryFn: async () => {
      return rightsClient.listMatchesByAccount(accountId ?? '', pageSize, pageToken);
    },
    enabled: !!accountId,
  });

  return {
    matches: response.data?.matches || [],
    nextPageToken: response.data?.nextPageToken || '',
    ...response,
  };
};
export default useListMatches;

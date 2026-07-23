import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { rightsClient } from '@modules/clients';

export const listIncomingClaimItemsKey = 'rightsClient/listIncomingClaimItemsPaginated';

export const useListIncomingClaimItems = (
  accountId: string,
  pageSize: number,
  pageToken: string,
) => {
  const response = useQuery({
    queryKey: [listIncomingClaimItemsKey, accountId, pageSize, pageToken],
    queryFn: async () => {
      return rightsClient.listIncomingClaimItems(accountId, true);
    },
    enabled: !!accountId,
    placeholderData: keepPreviousData,
  });

  return {
    claimItemGroups: response.data?.claimItemGroups || [],
    nextPageToken: response.data?.nextPageToken || '',
    ...response,
  };
};
export default useListIncomingClaimItems;

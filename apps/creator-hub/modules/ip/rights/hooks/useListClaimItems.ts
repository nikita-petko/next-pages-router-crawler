import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { rightsClient } from '@modules/clients';

export const listClaimItemsKey = 'rightsClient/listClaimItemsPaginated';

export const useListClaimItems = (
  accountId: string,
  pageSize: number,
  pageToken: string,
  status?: string,
) => {
  const statusFilter = status ? `status="${status.toLowerCase()}"` : '';
  const response = useQuery({
    queryKey: [listClaimItemsKey, accountId, pageSize, pageToken, statusFilter],
    queryFn: async () => {
      return rightsClient.listClaimItemsByAccount(accountId, pageSize, pageToken, statusFilter);
    },
    placeholderData: keepPreviousData,
  });

  return {
    claimItems: response.data?.claimItems || [],
    nextPageToken: response.data?.nextPageToken || '',
    ...response,
  };
};
export default useListClaimItems;

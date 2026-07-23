import { useQueries, UseQueryOptions } from '@tanstack/react-query';
import { rightsClient } from '@modules/clients';
import { useCallback, useMemo } from 'react';
import { ClaimItem, ClaimItemStatusEnum } from '@rbx/clients/rightsV1';
import useListClaimItems from './useListClaimItems';

export const listClaimItemsKey = 'rightsClient/listClaimItemsPaginated';

/**
 * useResolvedClaimItems polls claim items with a 'creating' status until they resolve to a new status
 * (e.g., Pending, Escalated). This prevents claims from appearing stuck in a
 * temporary loading state in the UI.
 */

export const useResolvedClaimItems = (
  accountId: string,
  pageSize: number,
  pageToken: string,
  status?: string,
) => {
  const { claimItems, nextPageToken, isPending, isPlaceholderData, error } = useListClaimItems(
    accountId,
    pageSize,
    pageToken,
    status,
  );

  const getClaimItem = useCallback(
    async (item: ClaimItem): Promise<ClaimItem> => {
      if (!item.claimId || !item.id) {
        throw new Error('ClaimId or claimItemId does not exist');
      }
      return rightsClient.getClaimItem(accountId, item.claimId, item.id);
    },
    [accountId],
  );

  const claimItemQueries = useMemo(() => {
    return claimItems.map((item): UseQueryOptions<ClaimItem, Error> => {
      const isCreating = item.status === ClaimItemStatusEnum.Creating;
      return {
        queryKey: ['claimItem', item.id],
        queryFn: () => getClaimItem(item),
        enabled: isCreating,
        refetchInterval: (query) => {
          const claimItemData = query.state.data;
          if (query.state.status !== 'success' || !claimItemData) {
            return 1000;
          }
          return claimItemData.status === ClaimItemStatusEnum.Creating ? 2000 : false;
        },
        initialData: item,
      };
    });
  }, [claimItems, getClaimItem]);

  const response = useQueries({
    queries: claimItemQueries,
    // combine helps stabilize response
    combine: (results) => {
      return {
        data: results.map((result) => result.data!),
        pending: results.some((result) => result.isPending),
      };
    },
  });

  return {
    displayItems: response.data,
    nextPageToken,
    isPending,
    isPlaceholderData,
    error,
  };
};
export default useResolvedClaimItems;

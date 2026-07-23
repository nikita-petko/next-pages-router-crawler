import { useCallback } from 'react';
import organizationApiClient from '@modules/clients/organizationApi';
import {
  useCachedBatchFetcher,
  type UseCachedBatchFetcherResult,
} from '@modules/miscellaneous/hooks';
import payoutsConstants from '../constants/payoutsConstants';

export type LatestPayoutFetcher = (userIds: number[]) => Promise<Map<number, LatestPayoutResponse>>;

export interface LatestPayoutInfo {
  amount: number;
  createdAt: Date;
}

export type PayoutStatus = 'Success' | 'Failure';

export interface LatestPayoutResponse {
  status: PayoutStatus;
  oneTimePayout: LatestPayoutInfo | null;
}

export interface UseLatestOneTimePayoutsResult
  extends Omit<UseCachedBatchFetcherResult<number, LatestPayoutResponse>, 'fetchItems'> {
  fetchLatestPayouts: (userIds: number[]) => Promise<Map<number, LatestPayoutResponse>>;
}

const useLatestOneTimePayout = (organizationId: string): UseLatestOneTimePayoutsResult => {
  const { fetchItems, isFetching, clearCache } = useCachedBatchFetcher<
    number,
    LatestPayoutResponse
  >({
    batchFetch: useCallback(
      async (batchUserIds: number[]) => {
        const response =
          await organizationApiClient.groupUniversePayoutClient.getLatestOneTimePayoutForUsers(
            organizationId,
            batchUserIds,
          );

        const payoutsMap = new Map<number, LatestPayoutResponse>();

        response.payouts.forEach((payoutResponse) => {
          const userId = parseInt(payoutResponse.recipientUserId, 10);
          const status = payoutResponse.status as PayoutStatus;

          payoutsMap.set(userId, {
            status,
            oneTimePayout: payoutResponse.oneTimePayout
              ? {
                  amount: parseInt(payoutResponse.oneTimePayout.amount, 10),
                  createdAt: payoutResponse.oneTimePayout.createdAt,
                }
              : null,
          });
        });

        return payoutsMap;
      },
      [organizationId],
    ),
    maxBatchSize: payoutsConstants.LatestOneTimePayoutMaxPageSize,
    cacheKey: organizationId,
  });

  const fetchLatestPayouts: LatestPayoutFetcher = useCallback(
    async (userIds: number[]): Promise<Map<number, LatestPayoutResponse>> => {
      if (userIds.length === 0) {
        return new Map();
      }
      return fetchItems(userIds);
    },
    [fetchItems],
  );

  return {
    fetchLatestPayouts,
    clearCache,
    isFetching,
  };
};

export default useLatestOneTimePayout;

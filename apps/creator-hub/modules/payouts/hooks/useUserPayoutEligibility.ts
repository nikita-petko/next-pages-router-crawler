import { useCallback, useMemo } from 'react';
import { economyClient } from '@modules/clients';
import { useCachedBatchFetcher } from '@modules/miscellaneous/hooks';
import { EconomyEligibilityMaxPageSize } from '../constants/payoutsConstants';

export type UserPayoutEligibilityStatus =
  | 'Eligible'
  | 'NotInGroup'
  | 'PayoutRestricted'
  | 'Undefined';

export type TUseUserPayoutEligibilityOptions = {
  groupId: string;
};

export type PayoutEligibilityChecker = (
  userIds: number[],
) => Promise<Map<number, UserPayoutEligibilityStatus>>;

const useUserPayoutEligibility = ({ groupId }: TUseUserPayoutEligibilityOptions) => {
  const { fetchItems, isFetching } = useCachedBatchFetcher<number, UserPayoutEligibilityStatus>({
    batchFetch: useCallback(
      async (userIds: number[]) => {
        const groupIdNum = Number.parseInt(groupId, 10);
        const eligibilityMap = new Map<number, UserPayoutEligibilityStatus>();

        const response = await economyClient.getGroupUserPayoutEligibility(groupIdNum, userIds);

        Object.entries(response.usersGroupPayoutEligibility ?? []).forEach(
          ([userIdString, eligibilityStatus]) => {
            const userId = Number.parseInt(userIdString, 10);
            eligibilityMap.set(userId, eligibilityStatus as UserPayoutEligibilityStatus);
          },
        );

        return eligibilityMap;
      },
      [groupId],
    ),
    maxBatchSize: EconomyEligibilityMaxPageSize,
    cacheKey: groupId,
  });

  const checkPayoutEligibility: PayoutEligibilityChecker = useCallback(
    async (userIds: number[]): Promise<Map<number, UserPayoutEligibilityStatus>> => {
      if (userIds.length === 0 || !groupId) {
        return new Map();
      }
      return fetchItems(userIds);
    },
    [groupId, fetchItems],
  );

  const returnValue = useMemo(
    () => ({
      checkPayoutEligibility,
      isFetching,
    }),
    [checkPayoutEligibility, isFetching],
  );

  return returnValue;
};

export default useUserPayoutEligibility;

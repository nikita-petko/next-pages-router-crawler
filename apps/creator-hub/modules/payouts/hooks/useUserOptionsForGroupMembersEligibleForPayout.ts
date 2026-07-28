import { useCallback, useEffect, useState } from 'react';
import type { ValidatedUser } from '@modules/clients/typeGuards';
import { isValidUser } from '@modules/clients/typeGuards';
import type { User } from '@modules/clients/users';
import usersClient from '@modules/clients/users';
import useUserOptionsForGroupMembers from '@modules/miscellaneous/components/UserSelect/optionsHook/useUserOptionsForGroupMembers';
import type { TUseUserOptionsForGroupMembersOptions } from '@modules/miscellaneous/components/UserSelect/optionsHook/useUserOptionsForGroupMembers';
import type { UserStatus } from '@modules/miscellaneous/components/UserSelect/types';
import { useSuggestedPayouts, type SuggestedPayoutInfo } from '@modules/react-query/payouts';
import { SuggestedPayoutsLimit } from '../constants/payoutsConstants';
import type { LatestPayoutFetcher } from './useLatestOneTimePayout';
import useLatestOneTimePayout from './useLatestOneTimePayout';
import type { PayoutEligibilityChecker } from './useUserPayoutEligibility';
import useUserPayoutEligibility from './useUserPayoutEligibility';

export type PayoutMetadata = SuggestedPayoutInfo;

type TUseUserOptionsForGroupMembersEligibleForPayoutOptions =
  TUseUserOptionsForGroupMembersOptions & {
    groupId: string;
    organizationId: string;
  };

const setPayoutMetadata = (
  statusMap: Map<number, UserStatus<PayoutMetadata>>,
  userId: number,
  metadata: PayoutMetadata,
) => {
  statusMap.set(userId, { category: 'PayoutMetadata', disabled: false, metadata });
};

const setIneligible = (statusMap: Map<number, UserStatus<PayoutMetadata>>, userId: number) => {
  statusMap.set(userId, { category: 'Ineligible', disabled: true });
};

const userToMapEntry = (u: ValidatedUser): [number, ValidatedUser] => [u.id, u];

const getPayoutTime = (status?: UserStatus<PayoutMetadata>): number | undefined => {
  if (status?.category === 'PayoutMetadata' && status.metadata) {
    return status.metadata.createdAt.getTime();
  }
  return undefined;
};

const checkEligibilityAndLatestPayouts = async (
  usersToCheck: ValidatedUser[],
  statusMap: Map<number, UserStatus<PayoutMetadata>>,
  checkPayoutEligibility: PayoutEligibilityChecker,
  fetchLatestPayouts: LatestPayoutFetcher,
) => {
  const eligibilityMap = await checkPayoutEligibility(usersToCheck.map((u) => u.id));

  // Mark ineligible users and filter for eligible ones
  const eligibleUsers: ValidatedUser[] = [];
  usersToCheck.forEach((u) => {
    if (eligibilityMap.get(u.id) === 'Eligible') {
      eligibleUsers.push(u);
    } else {
      setIneligible(statusMap, u.id);
    }
  });

  // Fetch latest payouts for eligible users only
  if (eligibleUsers.length > 0) {
    const latestPayoutsMap = await fetchLatestPayouts(eligibleUsers.map((u) => u.id));

    latestPayoutsMap.forEach((payoutResponse, userId) => {
      if (payoutResponse.oneTimePayout) {
        setPayoutMetadata(statusMap, userId, payoutResponse.oneTimePayout);
      }
    });
  }
};

const useUserOptionsForGroupMembersEligibleForPayout = ({
  excludeCurrentUser,
  groupId,
  organizationId,
  excludeUserIds,
}: TUseUserOptionsForGroupMembersEligibleForPayoutOptions) => {
  const baseProps = useUserOptionsForGroupMembers({ excludeCurrentUser, excludeUserIds });
  const [userStatus, setUserStatus] = useState<Map<number, UserStatus<PayoutMetadata>>>(new Map());
  const [userOptions, setUserOptions] = useState<User[]>([]);
  const [lastSearchValue, setLastSearchValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { checkPayoutEligibility } = useUserPayoutEligibility({ groupId });
  const { suggestedPayoutsMap, isFetching: isFetchingSuggestions } =
    useSuggestedPayouts(organizationId);
  const { fetchLatestPayouts } = useLatestOneTimePayout(organizationId);

  const updateUserSuggestions = useCallback(
    (searchValue: string) => {
      setLastSearchValue(searchValue);
      baseProps.updateUserSuggestions(searchValue);
    },
    [baseProps],
  );

  const isIdIncluded = useCallback((id: number) => !excludeUserIds?.has(id), [excludeUserIds]);

  const isSearchQueryEmpty = lastSearchValue.trim().length === 0;

  useEffect(() => {
    let isCancelled = false;

    const processUsers = async () => {
      if (baseProps.isFetching) {
        return;
      }

      let allUserOptions: ValidatedUser[] = baseProps.userOptions.filter(
        (u): u is ValidatedUser => isValidUser(u) && isIdIncluded(u.id),
      );

      const suggestedUserIds = Array.from(suggestedPayoutsMap.keys()).filter(isIdIncluded);

      if (allUserOptions.length === 0 && suggestedUserIds.length === 0) {
        if (!isCancelled) {
          setUserStatus(baseProps.userStatus as Map<number, UserStatus<PayoutMetadata>>);
          setUserOptions([]);
          setIsProcessing(false);
        }
        return;
      }

      setIsProcessing(true);

      const suggestedUsersSet = new Set(suggestedUserIds);
      const statusMap = new Map(baseProps.userStatus as Map<number, UserStatus<PayoutMetadata>>);

      // Add suggestion metadata to status map
      suggestedPayoutsMap.forEach((metadata, userId) => {
        if (isIdIncluded(userId)) {
          setPayoutMetadata(statusMap, userId, metadata);
        }
      });

      if (isSearchQueryEmpty) {
        // If no search query, show suggestions first, fill up to max suggestions with base users
        const baseUserIds = new Set(allUserOptions.map((u) => u.id));

        // Fetch suggested users that are not already fetched by base props
        const suggestedUserIdsNotInBase = suggestedUserIds.filter((id) => !baseUserIds.has(id));

        let fetchedSuggestedUsers: ValidatedUser[] = [];
        if (suggestedUserIdsNotInBase.length > 0) {
          try {
            const usersResponse = await usersClient.getUsersByIds(suggestedUserIdsNotInBase);
            fetchedSuggestedUsers = usersResponse.data?.filter(isValidUser) ?? [];
          } catch {
            // If batch fetch fails, fetchedSuggestedUsers remains empty
          }
        }

        const allUsersById = new Map<number, ValidatedUser>([
          ...allUserOptions.map(userToMapEntry),
          ...fetchedSuggestedUsers.map(userToMapEntry),
        ]);

        const suggestedUsers = suggestedUserIds
          .map((id) => allUsersById.get(id))
          .filter((u) => u !== undefined);

        // Avoid duplicating suggestions
        const baseUsersNotInSuggestions = allUserOptions.filter(
          (u) => !suggestedUsersSet.has(u.id),
        );

        allUserOptions = [...suggestedUsers, ...baseUsersNotInSuggestions];
      }

      // Apply suggestion limit
      const limitedUserOptions = allUserOptions.slice(0, SuggestedPayoutsLimit);

      const usersToCheck = limitedUserOptions.filter((u) => !suggestedUsersSet.has(u.id));
      if (usersToCheck.length > 0) {
        await checkEligibilityAndLatestPayouts(
          usersToCheck,
          statusMap,
          checkPayoutEligibility,
          fetchLatestPayouts,
        );
      }

      if (isSearchQueryEmpty) {
        limitedUserOptions.sort((a, b) => {
          // Sort by payout date: users with payout metadata first (newest first), then users without
          const aTime = getPayoutTime(statusMap.get(a.id));
          const bTime = getPayoutTime(statusMap.get(b.id));

          // If both have payouts, sort by newest first
          if (aTime !== undefined && bTime !== undefined) {
            return bTime - aTime;
          }

          // Otherwise, whichever has a payout comes first
          if (aTime !== undefined) {
            return -1;
          }
          if (bTime !== undefined) {
            return 1;
          }
          return 0;
        });
      }

      if (!isCancelled) {
        setUserOptions(limitedUserOptions);
        setUserStatus(statusMap);
        setIsProcessing(false);
      }
    };

    processUsers();

    return () => {
      isCancelled = true;
    };
  }, [
    baseProps.userOptions,
    baseProps.userStatus,
    baseProps.isFetching,
    checkPayoutEligibility,
    fetchLatestPayouts,
    suggestedPayoutsMap,
    isSearchQueryEmpty,
    excludeUserIds,
    isIdIncluded,
  ]);

  return {
    ...baseProps,
    userOptions,
    userStatus,
    updateUserSuggestions,
    isFetching: baseProps.isFetching || isFetchingSuggestions || isProcessing,
  };
};

export default useUserOptionsForGroupMembersEligibleForPayout;

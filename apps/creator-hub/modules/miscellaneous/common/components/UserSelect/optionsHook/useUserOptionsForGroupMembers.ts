import { useCallback, useEffect, useMemo, useState } from 'react';
import { User, usersClient, isValidUser, type ValidatedUser } from '@modules/clients';
import { useAuthentication } from '@modules/authentication/providers';
import { V1UsersSearchGetLimitEnum } from '@rbx/clients/users';
import useDebouncedFunction from '../../../../hooks/useDebouncedFunction';
import { UserStatus, UserOptionsHook } from '../types';
import useCurrentGroupUtils from '../serviceHook/useCurrentGroupUtils';

export type TUseUserOptionsForGroupMembersOptions = {
  excludeCurrentUser: boolean;
  excludeUserIds?: Set<number>;
};

const EMPTY_SET = new Set<number>();

const useUserOptionsForGroupMembers: UserOptionsHook = ({
  excludeCurrentUser,
  excludeUserIds = EMPTY_SET,
}: TUseUserOptionsForGroupMembersOptions) => {
  const {
    isUserInGroup,
    isFetching: isGroupUtilsFetching,
    allInvitedUsersAndMembers,
  } = useCurrentGroupUtils({ overrideFetchAllInvitedUsersAndMembers: true });

  const { user: currentUser } = useAuthentication();
  const [userOptions, setUserOptions] = useState<User[]>([]);
  const [userStatus, setUserStatus] = useState<Map<number, UserStatus>>(() => new Map());
  const [isFetching, setIsFetching] = useState(false);
  const [noOptionsText, setNoOptionsText] = useState<string>('Label.NeedMoreThanTwoCharacters');

  const allExcludedUserIds = useMemo(() => {
    const excluded = new Set(excludeUserIds);
    if (excludeCurrentUser && currentUser?.id != null) {
      excluded.add(currentUser.id);
    }
    return excluded;
  }, [excludeCurrentUser, currentUser?.id, excludeUserIds]);

  const filterAndUpdateUserStatus = useCallback(
    async (unfilteredUsers: User[]) => {
      // Filter out invalid or excluded users
      const validUsers = unfilteredUsers.filter((user): user is ValidatedUser => {
        return isValidUser(user) && !allExcludedUserIds.has(user.id);
      });

      // Check membership for valid users
      const memberCheckResults = await Promise.all(
        validUsers.map(async (user) => ({
          user,
          isMember: await isUserInGroup(user.id),
        })),
      );

      // Filter to only members
      const memberUsers = memberCheckResults
        .filter((result) => result.isMember)
        .map((result) => result.user);

      const newUserStatus = new Map<number, UserStatus>();

      setUserOptions(memberUsers);
      setUserStatus(newUserStatus);
      setIsFetching(false);
    },
    [isUserInGroup, allExcludedUserIds],
  );

  useEffect(() => {
    if (allInvitedUsersAndMembers) {
      filterAndUpdateUserStatus(allInvitedUsersAndMembers);
    }
  }, [allInvitedUsersAndMembers, filterAndUpdateUserStatus]);

  const updateUserSuggestionsInternal = useCallback(
    async (trimmedValue: string) => {
      if (isGroupUtilsFetching) return;
      let foundUsers: User[] = [];
      try {
        if (allInvitedUsersAndMembers) {
          foundUsers = allInvitedUsersAndMembers.filter((user) => {
            return (
              user.name?.toLowerCase().includes(trimmedValue.toLowerCase()) ||
              user.displayName?.toLowerCase().includes(trimmedValue.toLowerCase()) ||
              user.id === parseInt(trimmedValue, 10)
            );
          });
        } else {
          const { data } = await usersClient.searchUsers(
            trimmedValue,
            V1UsersSearchGetLimitEnum.NUMBER_10,
          );
          foundUsers = data ?? [];

          // in case a userid is passed in, we want to add that user to the list
          const searchUserId = parseInt(trimmedValue, 10);
          if (!Number.isNaN(searchUserId)) {
            const searchUser = await usersClient.getUserById(searchUserId);
            foundUsers.unshift(searchUser);
          }
        }
      } catch {
        // eslint-disable-next-line no-empty -- we don't care about the error
      }
      await filterAndUpdateUserStatus(foundUsers);
    },
    [isGroupUtilsFetching, allInvitedUsersAndMembers, filterAndUpdateUserStatus],
  );

  const [updateUserSuggestionsDebounced] = useDebouncedFunction(updateUserSuggestionsInternal, 200);

  const updateUserSuggestions = useCallback(
    (searchValue: string) => {
      const trimmedValue = searchValue.trim();
      setNoOptionsText('Label.NoCreatorsFound');
      setIsFetching(true);
      if (allInvitedUsersAndMembers) {
        updateUserSuggestionsInternal(trimmedValue);
      } else if (trimmedValue.length > 2) {
        updateUserSuggestionsDebounced(trimmedValue);
      } else {
        setIsFetching(false);
        setNoOptionsText('Label.NeedMoreThanTwoCharacters');
      }
    },
    [allInvitedUsersAndMembers, updateUserSuggestionsDebounced, updateUserSuggestionsInternal],
  );

  return { userOptions, userStatus, isFetching, noOptionsText, updateUserSuggestions };
};

export default useUserOptionsForGroupMembers;

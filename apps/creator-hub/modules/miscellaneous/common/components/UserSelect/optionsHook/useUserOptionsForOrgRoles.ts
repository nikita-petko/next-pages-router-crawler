import { useCallback, useEffect, useState } from 'react';
import { User, usersClient } from '@modules/clients';
import { V1UsersSearchGetLimitEnum } from '@rbx/clients/users';
import useDebouncedFunction from '../../../../hooks/useDebouncedFunction';
import { UserStatus, UserOptionsHook } from '../types';
import useCurrentGroupUtils from '../serviceHook/useCurrentGroupUtils';

const useUserOptionsForOrgRoles: UserOptionsHook = (roleId: string) => {
  const {
    isUserInGroup,
    isUserInvited,
    isUserInRole,
    isFetching: isGroupUtilsFetching,
    allInvitedUsersAndMembers,
  } = useCurrentGroupUtils({ roleId });

  const [userOptions, setUserOptions] = useState<User[]>([]);
  const [userStatus, setUserStatus] = useState<Map<number, UserStatus>>(new Map());
  const [isFetching, setIsFetching] = useState(false);
  const [noOptionsText, setNoOptionsText] = useState<string>('Label.NeedMoreThanTwoCharacters');

  const filterAndUpdateUserStatus = useCallback(
    async (foundUsers: User[]) => {
      const updatedUsers = await Promise.all(
        foundUsers.map(async (foundUser) => {
          const [isMember, isInvited, isInRole] = await Promise.all([
            isUserInGroup(foundUser.id!),
            isUserInvited(foundUser.id!),
            isUserInRole(foundUser.id!),
          ]);
          return { user: foundUser, isMember, isInvited, isInRole };
        }),
      );

      const newUserStatus = new Map<number, UserStatus>();

      const newUserOptions = updatedUsers
        .filter((u) => u.isInvited || u.isMember)
        .map((u) => {
          if (u.isInRole) {
            newUserStatus.set(u.user.id!, { category: 'Added', disabled: true });
          } else if (u.isInvited) {
            newUserStatus.set(u.user.id!, { category: 'InvitePending', disabled: false });
          } else {
            newUserStatus.delete(u.user.id!);
          }
          return u.user;
        });

      setUserOptions(newUserOptions);
      setUserStatus(newUserStatus);
      setIsFetching(false);
    },
    [isUserInGroup, isUserInvited, isUserInRole],
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
        setNoOptionsText('Label.NeedMoreThanTwoCharacters');
      }
    },
    [allInvitedUsersAndMembers, updateUserSuggestionsDebounced, updateUserSuggestionsInternal],
  );

  return { userOptions, userStatus, isFetching, noOptionsText, updateUserSuggestions };
};

export default useUserOptionsForOrgRoles;

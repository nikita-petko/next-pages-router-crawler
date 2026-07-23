import { useCallback, useEffect, useState } from 'react';
import { V1UsersSearchGetLimitEnum } from '@rbx/client-users/v1';
import { useAuthentication } from '@modules/authentication/providers';
import type { User } from '@modules/clients/users';
import usersClient from '@modules/clients/users';
import { useGetLikelyCollaborators } from '@modules/react-query/likelyCollaborator';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import { useDebouncedFunction } from '../../../hooks/useDebouncedFunction';
import useCurrentGroupUtils from '../serviceHook/useCurrentGroupUtils';
import type { UserStatus, UserOptionsHook } from '../types';

const MAX_PREFETCHED_SUGGESTIONS = 5;

const useUserOptionsForOrgInvites: UserOptionsHook = () => {
  const { settings, isFetched: isSettingsFetched } = useSettings();
  const {
    isUserInGroup,
    isUserInvited,
    isUserFriend,
    isFetching: isGroupUtilsFetching,
  } = useCurrentGroupUtils();
  const { user } = useAuthentication();
  const authenticatedUserId = user?.id;

  const [userOptions, setUserOptions] = useState<User[]>([]);
  const [userStatus, setUserStatus] = useState<Map<number, UserStatus>>(new Map());
  const [isFetching, setIsFetching] = useState(false);
  const [noOptionsText, setNoOptionsText] = useState<string>('Label.NeedMoreThanTwoCharacters');
  const [bottomText, setBottomText] = useState<string>();
  const { data: prefetchedLikelyCollaborators } = useGetLikelyCollaborators({
    userId: authenticatedUserId,
  });

  useEffect(() => {
    // oxlint-disable-next-line react/react-compiler -- syncing prefetched collaborators to userOptions on data arrival
    setUserOptions((prevUserOptions) => {
      // if there are already options (perhaps if the prefetch request was
      // unusually slow), don't update the options
      return prevUserOptions.length > 0
        ? prevUserOptions
        : prefetchedLikelyCollaborators.slice(0, MAX_PREFETCHED_SUGGESTIONS);
    });
  }, [prefetchedLikelyCollaborators]);

  const getLikelyCollaboratorSuggestions = useCallback(
    (trimmedValue: string) => {
      const lowercaseTrimmedValue = trimmedValue.toLowerCase();
      const isLikelyCollaboratorMatch = (likelyCollaborator: User) =>
        likelyCollaborator.name?.toLowerCase().startsWith(lowercaseTrimmedValue) === true ||
        likelyCollaborator.displayName?.toLowerCase().startsWith(lowercaseTrimmedValue) === true;
      return prefetchedLikelyCollaborators
        .filter(isLikelyCollaboratorMatch)
        .slice(0, MAX_PREFETCHED_SUGGESTIONS);
    },
    [prefetchedLikelyCollaborators],
  );

  const updateUserSuggestionsInternal = async (trimmedValue: string) => {
    const likelyCollaboratorSuggestions = getLikelyCollaboratorSuggestions(trimmedValue);
    const foundUsers: User[] = likelyCollaboratorSuggestions;
    const likelyCollaboratorIds = new Set(
      likelyCollaboratorSuggestions.map((likelyCollaborator) => likelyCollaborator.id),
    );
    try {
      const { data: searchUsersData } = await usersClient.searchUsers(
        trimmedValue,
        V1UsersSearchGetLimitEnum.NUMBER_10,
      );
      if (searchUsersData) {
        foundUsers.push(
          ...searchUsersData.filter(
            (searchUser) => searchUser.id == null || !likelyCollaboratorIds.has(searchUser.id),
          ),
        );
      }

      try {
        // in case a userid is passed in, we want to add that user to the list
        const searchUserId = parseInt(trimmedValue, 10);
        if (!Number.isNaN(searchUserId)) {
          const searchUser = await usersClient.getUserById(searchUserId);
          foundUsers.unshift(searchUser);
        }
      } catch {}
      setUserOptions(foundUsers);
    } catch {}
    setIsFetching(false);
  };

  const [updateUserSuggestionsDebounced] = useDebouncedFunction(updateUserSuggestionsInternal, 300);

  const updateUserSuggestions = (searchValue: string) => {
    const trimmedValue = searchValue.trim();
    setBottomText(undefined);
    if (trimmedValue.length > 2) {
      setNoOptionsText('Label.NoCreatorsFound');
      setIsFetching(true);
      updateUserSuggestionsDebounced(trimmedValue);
    } else {
      setNoOptionsText('Label.NeedMoreThanTwoCharacters');
      const likelyCollaboratorSuggestions = getLikelyCollaboratorSuggestions(trimmedValue);
      setUserOptions(likelyCollaboratorSuggestions);
      if (trimmedValue && likelyCollaboratorSuggestions.length > 0) {
        setBottomText('Label.NeedMoreThanTwoCharacters');
      }
    }
  };

  const shouldFetchFriends = isSettingsFetched && settings.enableGroupInvitationsTelemetry;

  useEffect(() => {
    if (isGroupUtilsFetching) {
      return;
    }
    userOptions.forEach(async (foundUser) => {
      if (foundUser.id == null) {
        return;
      }
      const userId = foundUser.id;
      const [isMember, isInvited, isFriend] = await Promise.all([
        isUserInGroup(userId),
        isUserInvited(userId),
        shouldFetchFriends && isUserFriend(userId),
      ]);
      setUserStatus((prevStatus) => {
        const newStatus = new Map(prevStatus);
        if (isMember) {
          newStatus.set(userId, { category: 'Added', disabled: true });
        } else if (isInvited) {
          newStatus.set(userId, { category: 'InvitePending', disabled: true });
        } else if (isFriend) {
          newStatus.set(userId, { category: 'Friend', disabled: false });
        } else {
          newStatus.delete(userId);
        }
        return newStatus;
      });
    });
  }, [
    userOptions,
    shouldFetchFriends,
    isGroupUtilsFetching,
    isUserInGroup,
    isUserInvited,
    isUserFriend,
  ]);

  return { userOptions, userStatus, isFetching, noOptionsText, updateUserSuggestions, bottomText };
};

export default useUserOptionsForOrgInvites;

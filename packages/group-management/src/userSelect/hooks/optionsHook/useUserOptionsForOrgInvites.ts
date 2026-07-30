import { useCallback, useEffect, useMemo, useState } from 'react';
import { V1UsersSearchGetLimitEnum } from '@rbx/client-users/v1';
import { useTranslation } from '@rbx/intl';
import type { User } from '../../../clients/users';
import usersClient from '../../../clients/users';
import useCurrentGroup from '../../../hooks/useCurrentGroup';
import useDebouncedFunction from '../../../hooks/useDebouncedFunction';
import { useGetLikelyCollaborators } from '../../../queries/likelyCollaboratorsQueries';
import type { UserOptionsHook, UserStatus } from '../../types';
import useCurrentGroupUtils from '../serviceHook/useCurrentGroupUtils';

const MAX_PREFETCHED_SUGGESTIONS = 5;

const useUserOptionsForOrgInvites: UserOptionsHook = () => {
  const {
    isUserInGroup,
    isUserInvited,
    isUserFriend,
    isFetching: isGroupUtilsFetching,
  } = useCurrentGroupUtils();
  const { user } = useCurrentGroup();
  const { translate } = useTranslation();
  const authenticatedUserId = user?.id;

  const [searchedUserOptions, setUserOptions] = useState<User[]>();
  const [userStatus, setUserStatus] = useState<Map<number, UserStatus>>(new Map());
  const [isFetching, setIsFetching] = useState(false);
  const [hasValidSearch, setHasValidSearch] = useState(false);
  const [showBottomText, setShowBottomText] = useState(false);
  const { data: prefetchedLikelyCollaborators } = useGetLikelyCollaborators({
    userId: authenticatedUserId,
  });
  const prefetchedUserOptions = useMemo(
    () => prefetchedLikelyCollaborators.slice(0, MAX_PREFETCHED_SUGGESTIONS),
    [prefetchedLikelyCollaborators],
  );
  const userOptions = searchedUserOptions ?? prefetchedUserOptions;
  const noOptionsText = translate(
    hasValidSearch ? 'Label.NoCreatorsFound' : 'Label.NeedMoreThanTwoCharacters',
  );
  const bottomText = showBottomText ? translate('Label.NeedMoreThanTwoCharacters') : undefined;

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

  const updateUserSuggestionsInternal = useCallback(
    async (trimmedValue: string) => {
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
          const searchUserId = parseInt(trimmedValue, 10);
          if (!Number.isNaN(searchUserId)) {
            const searchUser = await usersClient.getUserById(searchUserId);
            foundUsers.unshift(searchUser);
          }
        } catch {}
        setUserOptions(foundUsers);
      } catch {}
      setIsFetching(false);
    },
    [getLikelyCollaboratorSuggestions],
  );

  const [updateUserSuggestionsDebounced] = useDebouncedFunction(updateUserSuggestionsInternal, 300);

  const updateUserSuggestions = useCallback(
    (searchValue: string) => {
      const trimmedValue = searchValue.trim();
      setShowBottomText(false);
      if (trimmedValue.length > 2) {
        setHasValidSearch(true);
        setIsFetching(true);
        updateUserSuggestionsDebounced(trimmedValue);
      } else {
        setHasValidSearch(false);
        const likelyCollaboratorSuggestions = getLikelyCollaboratorSuggestions(trimmedValue);
        setUserOptions(likelyCollaboratorSuggestions);
        if (trimmedValue && likelyCollaboratorSuggestions.length > 0) {
          setShowBottomText(true);
        }
      }
    },
    [getLikelyCollaboratorSuggestions, updateUserSuggestionsDebounced],
  );

  useEffect(() => {
    let cancelled = false;
    if (isGroupUtilsFetching) {
      return undefined;
    }

    void Promise.all(
      userOptions.map(async (foundUser) => {
        if (foundUser.id == null) {
          return;
        }
        const userId = foundUser.id;
        const [isMember, isInvited, isFriend] = await Promise.all([
          isUserInGroup(userId),
          isUserInvited(userId),
          isUserFriend(userId),
        ]);
        if (cancelled) {
          return;
        }
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
      }),
    );

    return () => {
      cancelled = true;
    };
  }, [userOptions, isGroupUtilsFetching, isUserInGroup, isUserInvited, isUserFriend]);

  return { userOptions, userStatus, isFetching, noOptionsText, updateUserSuggestions, bottomText };
};

export default useUserOptionsForOrgInvites;

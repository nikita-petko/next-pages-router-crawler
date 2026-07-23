import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import usersClient, { type MultiGetUserResponse } from '@modules/clients/users';

export type UserDisplayNamesById = ReadonlyMap<number, string>;

const USER_LOOKUP_BATCH_SIZE = 50;

const normalizeUserIds = (userIds: ReadonlyArray<number>): number[] =>
  Array.from(new Set(userIds.filter((userId) => Number.isSafeInteger(userId) && userId > 0))).sort(
    (left, right) => left - right,
  );

const fetchUsersByIds = async (
  userIds: ReadonlyArray<number>,
): Promise<ReadonlyArray<MultiGetUserResponse>> => {
  const requests: Array<ReturnType<typeof usersClient.getUsersByIds>> = [];
  for (let start = 0; start < userIds.length; start += USER_LOOKUP_BATCH_SIZE) {
    requests.push(usersClient.getUsersByIds(userIds.slice(start, start + USER_LOOKUP_BATCH_SIZE)));
  }
  const responses = await Promise.all(requests);
  return responses.flatMap((response) => response.data ?? []);
};

const selectUserDisplayNames = (
  users: ReadonlyArray<MultiGetUserResponse>,
): UserDisplayNamesById => {
  const displayNamesById = new Map<number, string>();
  for (const { id, displayName, name } of users) {
    const preferredName = displayName ?? name;
    if (id !== undefined && preferredName !== undefined) {
      displayNamesById.set(id, preferredName);
    }
  }
  return displayNamesById;
};

export const userDisplayNamesQueryKey = (userIds: ReadonlyArray<number>) =>
  ['user-display-names', ...userIds] as const;

/** Batch-resolves user ids to display names, falling back to usernames when necessary. */
export const useUserDisplayNamesQuery = (userIds: ReadonlyArray<number>) => {
  const normalizedUserIds = useMemo(() => normalizeUserIds(userIds), [userIds]);

  return useQuery({
    queryKey: userDisplayNamesQueryKey(normalizedUserIds),
    queryFn: () => fetchUsersByIds(normalizedUserIds),
    enabled: normalizedUserIds.length > 0,
    select: selectUserDisplayNames,
  });
};

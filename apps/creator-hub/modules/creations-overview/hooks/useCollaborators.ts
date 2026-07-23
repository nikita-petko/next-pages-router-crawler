import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuthentication } from '@modules/authentication/providers';
import friendsApiClient from '@modules/clients/friends';
import type { TrustedConnectionEntry } from '@modules/clients/teamCreateCollaboration';
import usersClient from '@modules/clients/users';

export interface Collaborator {
  userId: number;
  displayName: string;
  username: string;
  isFriend: boolean;
  errorReason: string;
}

export interface UseCollaboratorsResult {
  collaborators: Collaborator[];
  friends: Collaborator[];
  others: Collaborator[];
  isLoading: boolean;
  error: string | undefined;
}

const useCollaborators = (
  entries: TrustedConnectionEntry[] | undefined,
): UseCollaboratorsResult => {
  const { user } = useAuthentication();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const requestIdRef = useRef(0);

  const loadData = useCallback(async (userId: number, rawEntries: TrustedConnectionEntry[]) => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    setIsLoading(true);
    setError(undefined);

    try {
      if (rawEntries.length === 0) {
        setCollaborators([]);
        return;
      }

      const entryMap = new Map<number, TrustedConnectionEntry>(
        rawEntries.map((e) => [e.UserId, e]),
      );
      const userIds = rawEntries.map((e) => e.UserId);

      const [usersResponse, friendsResponse] = await Promise.all([
        usersClient.getUsersByIds(userIds),
        friendsApiClient.getWhichUsersAreFriendsOfUser(userId, userIds),
      ]);

      if (requestId !== requestIdRef.current) {
        return;
      }

      const friendsSet = new Set(friendsResponse?.friendsId ?? []);
      const userMap = new Map<number, { displayName?: string; name?: string }>();
      usersResponse?.data?.forEach((u) => {
        if (u.id != null) {
          userMap.set(u.id, u);
        }
      });

      const items: Collaborator[] = userIds.map((uid) => {
        const userData = userMap.get(uid);
        return {
          userId: uid,
          displayName: userData?.displayName ?? userData?.name ?? String(uid),
          username: userData?.name ?? String(uid),
          isFriend: friendsSet.has(uid),
          errorReason: entryMap.get(uid)?.ErrorReason ?? '',
        };
      });

      setCollaborators(items);
    } catch {
      if (requestId === requestIdRef.current) {
        setError('Failed to load collaborators.');
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!user?.id || entries === undefined) {
      return;
    }
    loadData(user.id, entries);
  }, [user?.id, entries, loadData]);

  const friends = useMemo(() => collaborators.filter((c) => c.isFriend), [collaborators]);
  const others = useMemo(() => collaborators.filter((c) => !c.isFriend), [collaborators]);

  return useMemo(
    () => ({ collaborators, friends, others, isLoading, error }),
    [collaborators, friends, others, isLoading, error],
  );
};

export default useCollaborators;

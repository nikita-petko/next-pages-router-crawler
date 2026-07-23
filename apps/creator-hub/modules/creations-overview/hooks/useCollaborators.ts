import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuthentication } from '@modules/authentication/providers';
import { usersClient } from '@modules/clients';
import friendsApiClient from '@modules/clients/friends';
import {
  getCanCollaborate,
  TrustedConnectionEntry,
} from '@modules/clients/teamCreateCollaboration';

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

const useCollaborators = (universeId: number): UseCollaboratorsResult => {
  const { user } = useAuthentication();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const requestIdRef = useRef(0);

  const loadData = useCallback(
    async (userId: number) => {
      requestIdRef.current += 1;
      const requestId = requestIdRef.current;

      setIsLoading(true);
      setError(undefined);

      try {
        const entries = await getCanCollaborate(universeId);
        if (requestId !== requestIdRef.current) return;

        if (entries.length === 0) {
          setCollaborators([]);
          return;
        }

        const entryMap = new Map<number, TrustedConnectionEntry>(entries.map((e) => [e.UserId, e]));
        const userIds = entries.map((e) => e.UserId);

        const [usersResponse, friendsResponse] = await Promise.all([
          usersClient.getUsersByIds(userIds),
          friendsApiClient.getWhichUsersAreFriendsOfUser(userId, userIds),
        ]);

        if (requestId !== requestIdRef.current) return;

        const friendsSet = new Set(friendsResponse?.friendsId ?? []);
        const usersData = usersResponse?.data ?? [];

        const items: Collaborator[] = userIds.map((uid) => {
          const userData = usersData.find((u) => u.id === uid);
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
    },
    [universeId],
  );

  useEffect(() => {
    if (!user?.id) return;
    loadData(user.id);
  }, [user?.id, loadData]);

  const friends = useMemo(() => collaborators.filter((c) => c.isFriend), [collaborators]);
  const others = useMemo(() => collaborators.filter((c) => !c.isFriend), [collaborators]);

  return { collaborators, friends, others, isLoading, error };
};

export default useCollaborators;

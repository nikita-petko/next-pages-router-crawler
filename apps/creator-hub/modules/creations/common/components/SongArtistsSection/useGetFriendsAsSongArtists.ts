import { useQuery } from '@tanstack/react-query';
import { useAuthentication } from '@modules/authentication/providers';
import friendsApiClient from '@modules/clients/friends';
import usersClient, { type MultiGetUserResponse } from '@modules/clients/users';

export type SongArtist = {
  userId: number;
  username: string;
  displayName?: string;
};

const USER_LOOKUP_BATCH_SIZE = 50;

export const getFriendsAsSongArtistsQueryKey = (userId?: number) =>
  ['friends-as-song-artists', userId] as const;

const getFriendsAsSongArtists = async (userId: number): Promise<SongArtist[]> => {
  const friends = await friendsApiClient.getUsersFriends(userId);
  const friendIds = Array.from(
    new Set(
      friends?.flatMap((friend) =>
        friend.id !== undefined && friend.id !== userId ? [friend.id] : [],
      ) ?? [],
    ),
  );

  const requests: Array<ReturnType<typeof usersClient.getUsersByIds>> = [];
  for (let start = 0; start < friendIds.length; start += USER_LOOKUP_BATCH_SIZE) {
    requests.push(
      usersClient.getUsersByIds(friendIds.slice(start, start + USER_LOOKUP_BATCH_SIZE)),
    );
  }
  const responses = await Promise.all(requests);
  const usersById = new Map<number, MultiGetUserResponse>();
  for (const friend of responses.flatMap((response) => response.data ?? [])) {
    if (friend.id !== undefined) {
      usersById.set(friend.id, friend);
    }
  }

  return friendIds.flatMap((friendId) => {
    const friend = usersById.get(friendId);
    return friend?.name
      ? [
          {
            userId: friendId,
            username: friend.name,
            displayName: friend.displayName ?? friend.name,
          },
        ]
      : [];
  });
};

const useGetFriendsAsSongArtists = () => {
  const { user } = useAuthentication();
  const userId = user?.id;
  const {
    data: friends = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: getFriendsAsSongArtistsQueryKey(userId),
    queryFn: () => (userId === undefined ? [] : getFriendsAsSongArtists(userId)),
    enabled: userId !== undefined,
  });
  const currentUser: SongArtist | undefined = user?.name
    ? {
        userId: user.id,
        username: user.name,
        displayName: user.displayName ?? user.name,
      }
    : undefined;

  return { data: currentUser ? [currentUser, ...friends] : friends, isLoading, isError };
};

export default useGetFriendsAsSongArtists;

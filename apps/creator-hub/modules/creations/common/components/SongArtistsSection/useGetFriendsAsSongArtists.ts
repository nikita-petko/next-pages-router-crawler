import { useAuthentication } from '@modules/authentication/providers';
import useGetUsersFriends from '@modules/react-query/friends/friendsQuery';

export type SongArtist = {
  userId: number;
  username: string;
  displayName?: string;
};

type FriendWithRequiredFields = {
  id: number;
  name: string;
  displayName?: string;
};

const hasFriendFields = (friend: {
  id?: number;
  name?: string;
  displayName?: string;
}): friend is FriendWithRequiredFields => friend.id != null && friend.name != null;

const useGetFriendsAsSongArtists = () => {
  const { user } = useAuthentication();
  const { data, isLoading, isError } = useGetUsersFriends(user?.id);

  const friends: SongArtist[] =
    data
      ?.filter(
        (friend): friend is FriendWithRequiredFields =>
          hasFriendFields(friend) && friend.id !== user?.id,
      )
      .map((friend) => ({
        userId: friend.id,
        username: friend.name,
        displayName: friend.displayName ?? friend.name,
      })) ?? [];
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

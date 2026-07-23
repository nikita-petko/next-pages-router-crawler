import { useQuery } from '@tanstack/react-query';
import friendsApiClient from '@modules/clients/friends';

const useGetUsersFriends = (userId?: number) => {
  return useQuery({
    enabled: !!userId,
    queryKey: ['friends', userId],
    queryFn: () => friendsApiClient.getUsersFriends(userId!),
  });
};

export default useGetUsersFriends;

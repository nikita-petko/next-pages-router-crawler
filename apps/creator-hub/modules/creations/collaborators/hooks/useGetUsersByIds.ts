import { useQuery } from '@tanstack/react-query';
import usersClient from '@modules/clients/users';

const useGetUsersByIds = (userIds: Array<number>) => {
  return useQuery({
    queryKey: ['getUsersByIds', userIds],
    queryFn: () => usersClient.getUsersByIds(userIds),
    enabled: userIds.length > 0,
  });
};

export default useGetUsersByIds;

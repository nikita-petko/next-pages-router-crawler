import { useQuery } from '@tanstack/react-query';
import usersClient from '@modules/clients/users';

const userDetailsKey = 'rightsClient/userDetails';

export default function useUserDetails(userId: number) {
  return useQuery({
    queryKey: [userDetailsKey, userId],
    queryFn: () => usersClient.getUserById(userId),
    enabled: userId > 0,
  });
}

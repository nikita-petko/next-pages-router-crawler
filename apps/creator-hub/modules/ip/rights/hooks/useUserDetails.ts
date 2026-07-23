import { usersClient } from '@modules/clients';
import { useQuery } from '@tanstack/react-query';

const userDetailsKey = 'rightsClient/userDetails';

export default function useUserDetails(userId: number) {
  return useQuery({
    queryKey: [userDetailsKey, userId],
    queryFn: () => usersClient.getUserById(userId),
    enabled: userId > 0,
  });
}

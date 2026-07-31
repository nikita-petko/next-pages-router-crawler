import { useQuery } from '@tanstack/react-query';
import { CreatorHomeClient } from '@modules/clients/creatorHome';

export const userScreenQueryKey = ['creatorHome', 'userScreen'] as const;

function useGetUserScreen() {
  return useQuery({
    queryKey: userScreenQueryKey,
    queryFn: ({ signal }) => CreatorHomeClient.userScreenApi.userScreenListUserScreen({ signal }),
  });
}

export default useGetUserScreen;

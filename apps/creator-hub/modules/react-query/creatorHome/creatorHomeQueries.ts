import { useQuery } from '@tanstack/react-query';
import { GroupListSurface } from '@rbx/client-creator-home-api/v1';
import { getGroupsQueryKey } from '@rbx/creator-hub-navigation';
import { useAuthentication } from '@modules/authentication/providers';
import getGroupsList from './creatorHomeRequest';

function useGetGroupsList() {
  const { user } = useAuthentication();

  return useQuery({
    queryKey: getGroupsQueryKey,
    enabled: !!user,
    queryFn: () =>
      getGroupsList({
        surface: GroupListSurface.CreatorHub,
      }),
  });
}

export default useGetGroupsList;

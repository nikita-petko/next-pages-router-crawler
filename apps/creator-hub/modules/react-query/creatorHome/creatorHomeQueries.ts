import { useQuery } from '@tanstack/react-query';
import { GroupListSurface } from '@rbx/clients/creatorHomeApi';
import { useAuthentication } from '@modules/authentication/providers';
import getGroupsList from './creatorHomeRequest';

function useGetGroupsList() {
  const { user } = useAuthentication();

  return useQuery({
    queryKey: ['getGroupsList'],
    enabled: !!user,
    queryFn: () =>
      getGroupsList({
        surface: GroupListSurface.CreatorHub,
      }),
  });
}

export default useGetGroupsList;

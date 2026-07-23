import { developClient } from '@modules/clients';
import { useQuery } from '@tanstack/react-query';

const getUniversePermissionsQueryKey = (universeId: number) => [
  'getUniversePermissions',
  universeId,
];

const useGetUniversePermissionsQuery = (universeId: number) => {
  return useQuery({
    queryKey: getUniversePermissionsQueryKey(universeId),
    queryFn: async () => {
      return developClient.getUniversePermissions(universeId);
    },
  });
};

export default useGetUniversePermissionsQuery;

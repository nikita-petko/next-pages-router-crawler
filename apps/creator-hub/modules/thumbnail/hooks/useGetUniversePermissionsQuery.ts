import { useQuery } from '@tanstack/react-query';
import developClient from '@modules/clients/develop';

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

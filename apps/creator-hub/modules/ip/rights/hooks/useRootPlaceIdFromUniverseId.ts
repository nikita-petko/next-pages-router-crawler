import { useQuery } from '@tanstack/react-query';
import { gamesClient } from '@modules/clients';

const rootPlaceIdQueryKey = (universeId: number) => ['gamesClient/rootPlaceId', universeId];

/**
 * Declaratively resolves a universe ID to its root place ID.
 * Automatically fetches when a valid universeId is provided;
 * stays disabled otherwise.
 */
const useRootPlaceIdFromUniverseId = (universeId: number | undefined) => {
  const query = useQuery({
    queryKey: rootPlaceIdQueryKey(universeId!),
    queryFn: async () => {
      const response = await gamesClient.getDetails([universeId!]);
      const rootPlaceId = response.data?.[0]?.rootPlaceId;
      if (rootPlaceId == null) {
        throw new Error('rootPlaceId not found for universe');
      }
      return rootPlaceId;
    },
    enabled: universeId != null && universeId > 0,
  });

  return {
    rootPlaceId: query.data ?? 0,
    isLoading: query.isLoading && query.fetchStatus !== 'idle',
    isError: query.isError,
  };
};

export default useRootPlaceIdFromUniverseId;

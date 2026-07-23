import { useQuery } from '@tanstack/react-query';
import openCloudV2Client from '@modules/clients/openCloud';

export default function useEnvironment(
  gameId: string | undefined,
  environmentId: string | undefined,
) {
  return useQuery({
    queryKey: ['environment', gameId, environmentId],
    queryFn: async () => {
      if (!gameId || !environmentId) {
        return null;
      }
      const [response] = await openCloudV2Client.getEnvironment({
        path: `universes/${gameId}/environments/${environmentId}`,
      });
      return response;
    },
    enabled: Boolean(gameId && environmentId),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

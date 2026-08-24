import { useQuery } from '@tanstack/react-query';
import type { PlaySessionQueryOptions } from '@modules/clients/analytics/universeSessionMetadataApi';
import { useUniverseSessionMetadataClient } from '../components/UniverseSessionMetadataClientProvider';

export type UseClientSessionsParams = PlaySessionQueryOptions & {
  readonly universeId: number | undefined;
};

export const getClientSessionsQueryKey = ({
  universeId,
  ...filterOptions
}: UseClientSessionsParams) =>
  ['universe-observability', 'client-sessions', { universeId, ...filterOptions }] as const;

// The play-session-query endpoint has no cursor and caps its result set (currently 500 rows),
// so this hook fetches the full capped list once and the table paginates over it client-side.
const useClientSessions = ({ universeId, ...filterOptions }: UseClientSessionsParams) => {
  const client = useUniverseSessionMetadataClient();

  return useQuery({
    queryKey: getClientSessionsQueryKey({ universeId, ...filterOptions }),
    queryFn: async ({ signal }) => {
      if (!universeId) {
        throw new Error('A universe ID is required to load client sessions.');
      }

      return client.getPlaySessions(universeId, filterOptions, signal);
    },
    enabled: universeId != null && universeId > 0,
  });
};

export default useClientSessions;

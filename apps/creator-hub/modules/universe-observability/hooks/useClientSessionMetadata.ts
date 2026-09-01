import { useQuery } from '@tanstack/react-query';
import { useUniverseSessionMetadataClient } from '../components/UniverseSessionMetadataClientProvider';

export type UseClientSessionMetadataParams = {
  readonly universeId: number | undefined;
  readonly sessionId: string | undefined;
};

export const getClientSessionMetadataQueryKey = ({
  universeId,
  sessionId,
}: UseClientSessionMetadataParams) =>
  ['universe-observability', 'client-session-metadata', { universeId, sessionId }] as const;

const useClientSessionMetadata = ({ universeId, sessionId }: UseClientSessionMetadataParams) => {
  const client = useUniverseSessionMetadataClient();

  return useQuery({
    queryKey: getClientSessionMetadataQueryKey({ universeId, sessionId }),
    queryFn: async ({ signal }) => {
      if (!universeId) {
        throw new Error('A universe ID is required to load client session metadata.');
      }
      if (!sessionId) {
        throw new Error('A session ID is required to load client session metadata.');
      }

      const sessions = await client.getPlaySessions(
        universeId,
        { playSessionIds: [sessionId] },
        signal,
      );
      const session = sessions[0];
      if (session == null) {
        throw new Error('No client session metadata was returned for the requested session.');
      }

      return session;
    },
    enabled: universeId != null && universeId > 0 && sessionId != null && sessionId.length > 0,
  });
};

export default useClientSessionMetadata;

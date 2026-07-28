import { useQuery } from '@tanstack/react-query';
import {
  getMockClientSessionMetadata,
  type GetClientSessionMetadataResponse,
} from '../mockData/clientSessionMetadata';
// Client session metadata is modeled by the shared ClientSession record (place, FPS,
// duration, memory usage) rather than a dedicated schema.

export type UseClientSessionMetadataParams = {
  readonly sessionId: string | undefined;
};

export const getClientSessionMetadataQueryKey = ({ sessionId }: UseClientSessionMetadataParams) =>
  ['universe-observability', 'client-session-metadata', sessionId] as const;

const useClientSessionMetadata = ({ sessionId }: UseClientSessionMetadataParams) =>
  useQuery<GetClientSessionMetadataResponse>({
    queryKey: getClientSessionMetadataQueryKey({ sessionId }),
    queryFn: () => {
      if (!sessionId) {
        throw new Error('A session ID is required to load client session metadata.');
      }

      return getMockClientSessionMetadata({ sessionId });
    },
    enabled: sessionId != null && sessionId.length > 0,
  });

export default useClientSessionMetadata;

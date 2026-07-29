import { useQuery } from '@tanstack/react-query';
import { clientSessionMetadataApi } from '../clients/clientSessionMetadataApi';
import type { GetClientSessionMetadataResponse } from '../mockData/clientSessionMetadata';
import { ClientSessionSchema, type ClientSession } from '../types/ClientSession';

type ClientSessionMetadata = {
  readonly session: ClientSession;
};

const mapClientSessionMetadata = (
  response: GetClientSessionMetadataResponse,
): ClientSessionMetadata => {
  const apiSession = response.session;
  const parseResult = ClientSessionSchema.safeParse({
    id: apiSession?.sessionId,
    device: apiSession?.device,
    status: apiSession?.status,
    startTime: apiSession?.startTime,
    durationMinute: apiSession?.durationMinute,
    placeVersion: apiSession?.placeVersion,
    placeName: apiSession?.placeName,
    averageFps: apiSession?.averageFps,
    memoryUsageMB: apiSession?.memoryUsageMB,
    dataAvailability: apiSession?.dataAvailability,
  });

  if (!parseResult.success) {
    console.error('Failed to parse client session metadata response.', {
      error: parseResult.error,
    });
    throw parseResult.error;
  }

  return { session: parseResult.data };
};

export type UseClientSessionMetadataParams = {
  readonly sessionId: string | undefined;
};

export const getClientSessionMetadataQueryKey = ({ sessionId }: UseClientSessionMetadataParams) =>
  ['universe-observability', 'client-session-metadata', sessionId] as const;

const useClientSessionMetadata = ({ sessionId }: UseClientSessionMetadataParams) =>
  useQuery({
    queryKey: getClientSessionMetadataQueryKey({ sessionId }),
    queryFn: async ({ signal }) => {
      if (!sessionId) {
        throw new Error('A session ID is required to load client session metadata.');
      }

      const response = await clientSessionMetadataApi.clientSessionsGetClientSessionMetadata(
        { sessionId },
        { signal },
      );
      return mapClientSessionMetadata(response);
    },
    enabled: sessionId != null && sessionId.length > 0,
  });

export default useClientSessionMetadata;

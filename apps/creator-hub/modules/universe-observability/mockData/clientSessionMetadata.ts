import { RAQIV2OperatingSystem, RAQIV2Platform } from '@rbx/creator-hub-analytics-config';
import { ClientSessionDataAvailability, ClientSessionStatus } from '../types/ClientSession';

/** Temporary transport contracts. Delete these with the mock when generated client types exist. */
export type ApiClientSessionDevice = {
  readonly platform?: string | null;
  readonly operatingSystem?: string | null;
  readonly memoryMB?: number | null;
};

export type ApiClientSessionMetadata = {
  readonly sessionId?: string | null;
  readonly device?: ApiClientSessionDevice | null;
  readonly status?: string | null;
  readonly startTime?: Date | null;
  readonly durationMinute?: number | null;
  readonly placeVersion?: string | null;
  readonly placeName?: string | null;
  readonly averageFps?: number | null;
  readonly memoryUsageMB?: number | null;
  readonly dataAvailability?: readonly string[] | null;
};

export type GetClientSessionMetadataRequest = {
  readonly sessionId: string;
};

export type GetClientSessionMetadataResponse = {
  readonly session?: ApiClientSessionMetadata | null;
};

export type ClientSessionMetadataApi = {
  readonly clientSessionsGetClientSessionMetadata: (
    request: GetClientSessionMetadataRequest,
    initOverrides?: RequestInit,
  ) => Promise<GetClientSessionMetadataResponse>;
};

const MOCK_RESPONSE_DELAY_MS = 1000;

const MOCK_CLIENT_SESSION: Omit<ApiClientSessionMetadata, 'sessionId'> = {
  device: {
    platform: RAQIV2Platform.Phone,
    operatingSystem: RAQIV2OperatingSystem.iOS,
    memoryMB: 4096,
  },
  status: ClientSessionStatus.Ended,
  startTime: new Date('2023-02-16T00:00:00Z'),
  durationMinute: 15,
  placeVersion: '1240',
  placeName: 'Adopt Me!',
  averageFps: 54.5,
  memoryUsageMB: 22.4,
  dataAvailability: [
    ClientSessionDataAvailability.MicroProfiler,
    ClientSessionDataAvailability.DMR,
  ],
};

const waitForMockResponse = async (signal?: AbortSignal | null): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('The operation was aborted.', 'AbortError'));
      return;
    }

    const handleAbort = () => {
      clearTimeout(timeoutId);
      reject(new DOMException('The operation was aborted.', 'AbortError'));
    };
    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort);
      resolve();
    }, MOCK_RESPONSE_DELAY_MS);
    signal?.addEventListener('abort', handleAbort, { once: true });
  });

const getMockClientSessionMetadata = async (
  { sessionId }: GetClientSessionMetadataRequest,
  initOverrides?: RequestInit,
): Promise<GetClientSessionMetadataResponse> => {
  await waitForMockResponse(initOverrides?.signal);

  return {
    session: {
      sessionId,
      ...MOCK_CLIENT_SESSION,
    },
  };
};

export const mockClientSessionMetadataApi: ClientSessionMetadataApi = {
  clientSessionsGetClientSessionMetadata: getMockClientSessionMetadata,
};

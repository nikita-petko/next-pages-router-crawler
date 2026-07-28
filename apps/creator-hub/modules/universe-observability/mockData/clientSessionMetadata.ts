import { RAQIV2OperatingSystem, RAQIV2Platform } from '@rbx/creator-hub-analytics-config';
import type { ClientSession } from '../types/ClientSession';
import { ClientSessionDataAvailability, ClientSessionStatus } from '../types/ClientSession';

const MOCK_RESPONSE_DELAY_MS = 1000;

type MockClientSessionDefinition = Omit<ClientSession, 'id'>;

const MOCK_CLIENT_SESSION: MockClientSessionDefinition = {
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

export type GetClientSessionMetadataRequest = {
  readonly sessionId: string;
};

export type GetClientSessionMetadataResponse = {
  readonly session: ClientSession;
};

const waitForMockResponse = async (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, MOCK_RESPONSE_DELAY_MS);
  });

export const getMockClientSessionMetadata = async ({
  sessionId,
}: GetClientSessionMetadataRequest): Promise<GetClientSessionMetadataResponse> => {
  await waitForMockResponse();

  return {
    session: {
      id: sessionId,
      ...MOCK_CLIENT_SESSION,
    },
  };
};

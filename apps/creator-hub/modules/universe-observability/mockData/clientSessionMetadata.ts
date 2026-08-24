import type {
  PlaySessionQueryOptions,
  UniversePlaySession,
  UniverseSessionMetadataApiClient,
} from '@modules/clients/analytics/universeSessionMetadataApi';
import {
  UniverseSessionDataAvailability,
  UniverseSessionExitReason,
  UniverseSessionOperatingSystem,
  UniverseSessionPlatform,
} from '@modules/clients/analytics/universeSessionMetadataApi';
import { MILLISECONDS_PER_MINUTE } from '../utils/durationMillisecondsToMinutes';

const MOCK_RESPONSE_DELAY_MS = 1000;

const MOCK_PLACES = [
  { placeName: "Wiggie's Place", placeId: '1818' },
  { placeName: 'Adopt Me!', placeId: '920587237' },
  { placeName: 'Brookhaven RP', placeId: '4924922222' },
] as const;

type MockDevice = {
  readonly platform: UniverseSessionPlatform;
  readonly os: UniverseSessionOperatingSystem;
  readonly clientDeviceRamMegabytes: number;
};

const MOCK_DEVICES: readonly MockDevice[] = [
  {
    platform: UniverseSessionPlatform.Phone,
    os: UniverseSessionOperatingSystem.Android,
    clientDeviceRamMegabytes: 2355,
  },
  {
    platform: UniverseSessionPlatform.Tablet,
    os: UniverseSessionOperatingSystem.IOs,
    clientDeviceRamMegabytes: 4096,
  },
  {
    platform: UniverseSessionPlatform.Computer,
    os: UniverseSessionOperatingSystem.Windows,
    clientDeviceRamMegabytes: 8192,
  },
  {
    platform: UniverseSessionPlatform.Console,
    os: UniverseSessionOperatingSystem.Xbox,
    clientDeviceRamMegabytes: 12288,
  },
];

const MOCK_EXIT_REASONS = [
  UniverseSessionExitReason.Active,
  UniverseSessionExitReason.Ended,
  UniverseSessionExitReason.Crashed,
] as const;

const MOCK_DATA_AVAILABILITY_COMBINATIONS: readonly (readonly UniverseSessionDataAvailability[])[] =
  [
    [UniverseSessionDataAvailability.Logs],
    [UniverseSessionDataAvailability.Logs, UniverseSessionDataAvailability.MicroProfiler],
    [UniverseSessionDataAvailability.Logs, UniverseSessionDataAvailability.SceneAnalysisSnapshot],
    [
      UniverseSessionDataAvailability.Logs,
      UniverseSessionDataAvailability.MicroProfiler,
      UniverseSessionDataAvailability.SceneAnalysisSnapshot,
    ],
    [],
  ];

const MOCK_SESSION_COUNT = 23;
const MOCK_SESSION_START_MS = new Date('2026-08-15T13:23:00Z').getTime();
const MOCK_SESSION_INTERVAL_MS = 41 * 60 * 1000;

export const createMockUniversePlaySession = (
  overrides: Partial<UniversePlaySession> = {},
): UniversePlaySession => ({
  playSessionId: 'session-id',
  firstPlaySessionId: null,
  universeId: null,
  placeId: null,
  placeVersion: null,
  playerId: null,
  jobId: null,
  platform: UniverseSessionPlatform.Phone,
  os: UniverseSessionOperatingSystem.IOs,
  clientRobloxVersion: null,
  exitReason: UniverseSessionExitReason.Ended,
  isActiveSession: false,
  startedTime: new Date('2023-02-16T00:00:00Z'),
  stoppedTime: null,
  durationMilliseconds: 15 * MILLISECONDS_PER_MINUTE,
  minFps: 54.5,
  minFpsTime: null,
  clientUsedMemoryMegabytes: 22.4,
  clientUsedMemoryPercentage: null,
  clientUsedMemoryTime: null,
  clientDeviceRamMegabytes: 4096,
  customTags: null,
  funnelTags: null,
  bugReportIds: null,
  placeName: '',
  dataAvailability: [],
  ...overrides,
});

const DETAIL_PLAY_SESSION = createMockUniversePlaySession({
  playSessionId: 'session-id',
  placeId: '920587237',
  placeVersion: 1240,
  placeName: 'Adopt Me!',
  dataAvailability: [
    UniverseSessionDataAvailability.MicroProfiler,
    UniverseSessionDataAvailability.SceneAnalysisSnapshot,
  ],
});

// Deterministic pseudo-random-looking mock dataset so tests and snapshots stay stable.
const buildMockPlaySessions = (): readonly UniversePlaySession[] => [
  DETAIL_PLAY_SESSION,
  ...Array.from({ length: MOCK_SESSION_COUNT }, (_unused, index) => {
    const place = MOCK_PLACES[index % MOCK_PLACES.length];
    const device = MOCK_DEVICES[index % MOCK_DEVICES.length];
    if (place == null || device == null) {
      throw new Error('Expected mock place and device entries.');
    }
    const minFps = Math.max(8, 60 - ((index * 5) % 55));
    const clientUsedMemoryMegabytes = 180 + ((index * 23) % 900);
    const exitReason = MOCK_EXIT_REASONS[index % MOCK_EXIT_REASONS.length];
    if (exitReason == null) {
      throw new Error('Expected a mock exit reason.');
    }

    return createMockUniversePlaySession({
      playSessionId: String(29705103 - index * 137),
      platform: device.platform,
      os: device.os,
      clientDeviceRamMegabytes: device.clientDeviceRamMegabytes,
      exitReason,
      isActiveSession: exitReason === UniverseSessionExitReason.Active,
      startedTime: new Date(MOCK_SESSION_START_MS - index * MOCK_SESSION_INTERVAL_MS),
      durationMilliseconds: (12 + ((index * 7) % 90)) * MILLISECONDS_PER_MINUTE,
      placeId: place.placeId,
      placeVersion: 8350 - index * 3,
      placeName: place.placeName,
      minFps,
      clientUsedMemoryMegabytes,
      dataAvailability:
        MOCK_DATA_AVAILABILITY_COMBINATIONS[index % MOCK_DATA_AVAILABILITY_COMBINATIONS.length] ??
        [],
    });
  }),
];

const MOCK_PLAY_SESSIONS = buildMockPlaySessions();

const waitForMockResponse = async (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, MOCK_RESPONSE_DELAY_MS);
  });

const getPlaySessions = async (
  _universeId: number,
  filterOptions: PlaySessionQueryOptions,
): Promise<readonly UniversePlaySession[]> => {
  await waitForMockResponse();

  const playSessionIds = filterOptions.playSessionIds ?? [];
  if (playSessionIds.length === 0) {
    return MOCK_PLAY_SESSIONS;
  }

  return MOCK_PLAY_SESSIONS.filter((session) => playSessionIds.includes(session.playSessionId));
};

export const mockUniverseSessionMetadataClient: UniverseSessionMetadataApiClient = {
  getPlaySessions,
};

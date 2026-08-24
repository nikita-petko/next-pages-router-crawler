import type {
  PlaySession as RawUniversePlaySession,
  PlaySessionQueryPlaySessionsRequest as PlaySessionQueryOptions,
  PlaySessionQueryResponse as RawUniversePlaySessionQueryResponse,
} from '@rbx/client-universe-session-metadata-service/v1';
import {
  ExitReason as UniverseSessionExitReason,
  OperatingSystem as UniverseSessionOperatingSystem,
  Platform as UniverseSessionPlatform,
  PlaySessionApi,
} from '@rbx/client-universe-session-metadata-service/v1';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import { createClientConfiguration } from '../utils/createClientConfiguration';

export { UniverseSessionExitReason, UniverseSessionOperatingSystem, UniverseSessionPlatform };

export type { PlaySessionQueryOptions };

/**
 * Frontend-only data-availability values. The current generated client does not
 * expose this field; the wrapper always fills an empty list until the package
 * is upgraded.
 */
export enum UniverseSessionDataAvailability {
  MicroProfiler = 'MICRO_PROFILER',
  SceneAnalysisSnapshot = 'SCENE_ANALYSIS_SNAPSHOT',
  Logs = 'LOGS',
}

type NormalizedPlaySessionField =
  | 'playSessionId'
  | 'platform'
  | 'os'
  | 'exitReason'
  | 'startedTime'
  | 'stoppedTime'
  | 'minFpsTime'
  | 'clientUsedMemoryTime';

/**
 * Refined play-session row. Every generated field is present; fields that the
 * service omits are represented as null. A row without a play-session id is
 * dropped while parsing, and missing/unknown enums use their Invalid member.
 * WIP frontend fields that the generated client does not yet return are filled
 * with empty/null values rather than invented numbers.
 */
export type UniversePlaySession = Omit<
  Readonly<Required<RawUniversePlaySession>>,
  NormalizedPlaySessionField
> & {
  readonly playSessionId: string;
  readonly platform: UniverseSessionPlatform;
  readonly os: UniverseSessionOperatingSystem;
  readonly exitReason: UniverseSessionExitReason;
  readonly startedTime: Date | null;
  readonly stoppedTime: Date | null;
  readonly minFpsTime: Date | null;
  readonly clientUsedMemoryTime: Date | null;
  readonly placeName: string;
  readonly dataAvailability: readonly UniverseSessionDataAvailability[];
};

export type UniverseSessionMetadataApiClient = {
  readonly getPlaySessions: (
    universeId: number,
    filterOptions: PlaySessionQueryOptions,
    signal?: AbortSignal,
  ) => Promise<readonly UniversePlaySession[]>;
};

const EMPTY_DATA_AVAILABILITY: readonly UniverseSessionDataAvailability[] = [];

const parseEnum = <TEnum extends string>(
  enumObject: { readonly [key: string]: TEnum },
  value: string | null | undefined,
  invalidValue: TEnum,
): TEnum => {
  return value != null && isValidEnumValue(enumObject, value) ? value : invalidValue;
};

const parseOptionalDate = (value: Date | null | undefined): Date | null => {
  if (value == null) {
    return null;
  }
  return Number.isNaN(value.getTime()) ? null : value;
};

export const parseUniversePlaySession = (
  raw: RawUniversePlaySession,
): UniversePlaySession | null => {
  if (raw.playSessionId == null || raw.playSessionId === '') {
    return null;
  }

  return {
    playSessionId: raw.playSessionId,
    firstPlaySessionId: raw.firstPlaySessionId ?? null,
    universeId: raw.universeId ?? null,
    placeId: raw.placeId ?? null,
    placeVersion: raw.placeVersion ?? null,
    playerId: raw.playerId ?? null,
    jobId: raw.jobId ?? null,
    platform: parseEnum(UniverseSessionPlatform, raw.platform, UniverseSessionPlatform.Invalid),
    os: parseEnum(UniverseSessionOperatingSystem, raw.os, UniverseSessionOperatingSystem.Invalid),
    clientRobloxVersion: raw.clientRobloxVersion ?? null,
    exitReason: parseEnum(
      UniverseSessionExitReason,
      raw.exitReason,
      UniverseSessionExitReason.Invalid,
    ),
    isActiveSession: raw.isActiveSession ?? null,
    startedTime: parseOptionalDate(raw.startedTime),
    stoppedTime: parseOptionalDate(raw.stoppedTime),
    durationMilliseconds: raw.durationMilliseconds ?? null,
    minFps: raw.minFps ?? null,
    minFpsTime: parseOptionalDate(raw.minFpsTime),
    clientUsedMemoryMegabytes: raw.clientUsedMemoryMegabytes ?? null,
    clientUsedMemoryPercentage: raw.clientUsedMemoryPercentage ?? null,
    clientUsedMemoryTime: parseOptionalDate(raw.clientUsedMemoryTime),
    clientDeviceRamMegabytes: raw.clientDeviceRamMegabytes ?? null,
    customTags: raw.customTags ?? null,
    funnelTags: raw.funnelTags ?? null,
    bugReportIds: raw.bugReportIds ?? null,
    // Place names come from a separate PlaceApi request, not this RPC.
    // TODO(@yukihe): resolve place names so the browser and detail sheet stop rendering a blank name.
    placeName: '',
    dataAvailability: EMPTY_DATA_AVAILABILITY,
  };
};

export const parseUniversePlaySessionQueryResponse = (
  raw: RawUniversePlaySessionQueryResponse,
): readonly UniversePlaySession[] => {
  // The service omits empty repeated fields, so an absent list means zero sessions.
  const playSessions = raw.playSessions ?? [];
  if (!Array.isArray(playSessions)) {
    throw new TypeError('Play session query response has a malformed playSessions field.');
  }

  return playSessions
    .map((session) => parseUniversePlaySession(session))
    .filter((session): session is UniversePlaySession => session !== null);
};

const configuration = createClientConfiguration('universe-session-metadata-service', 'bedev2');
const playSessionApi = new PlaySessionApi(configuration);

const getPlaySessions = async (
  universeId: number,
  filterOptions: PlaySessionQueryOptions,
  signal?: AbortSignal,
): Promise<readonly UniversePlaySession[]> => {
  const rawResponse = await playSessionApi.playSessionQueryPlaySessions(
    {
      universeId,
      playSessionQueryPlaySessionsRequest: filterOptions,
    },
    { signal },
  );
  return parseUniversePlaySessionQueryResponse(rawResponse);
};

const universeSessionMetadataClient: UniverseSessionMetadataApiClient = {
  getPlaySessions,
};

export default universeSessionMetadataClient;

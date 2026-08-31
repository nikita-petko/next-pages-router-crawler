import type {
  GetSessionPlacesWithVersionsResponse as RawUniverseSessionPlacesResponse,
  Place as RawUniverseSessionPlace,
  PlaySession as RawUniversePlaySession,
  PlaySessionQueryPlaySessionsRequest as PlaySessionQueryOptions,
  PlaySessionQueryResponse as RawUniversePlaySessionQueryResponse,
} from '@rbx/client-universe-session-metadata-service/v1';
import {
  ExitReason as UniverseSessionExitReason,
  OperatingSystem as UniverseSessionOperatingSystem,
  PlaceApi,
  Platform as UniverseSessionPlatform,
  PlaySessionApi,
} from '@rbx/client-universe-session-metadata-service/v1';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import { createClientConfiguration } from '../utils/createClientConfiguration';

export { UniverseSessionExitReason, UniverseSessionOperatingSystem, UniverseSessionPlatform };

export type { PlaySessionQueryOptions };

type NormalizedPlaySessionField =
  | 'playSessionId'
  | 'placeName'
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
 * dropped while parsing. Missing platforms are null; missing OS values use
 * Unknown; missing/unknown exit reasons use Invalid. Place name is null when
 * the registry has none.
 */
export type UniversePlaySession = Omit<
  Readonly<Required<RawUniversePlaySession>>,
  NormalizedPlaySessionField
> & {
  readonly playSessionId: string;
  readonly placeName: string | null;
  readonly platform: UniverseSessionPlatform | null;
  readonly os: UniverseSessionOperatingSystem;
  readonly exitReason: UniverseSessionExitReason;
  readonly startedTime: Date | null;
  readonly stoppedTime: Date | null;
  readonly minFpsTime: Date | null;
  readonly clientUsedMemoryTime: Date | null;
};

/** Place + played versions for session-browser filter options, from PlaceApi. */
export type UniverseSessionPlace = {
  readonly placeId: string;
  readonly placeName: string | null;
  readonly versions: readonly number[];
};

export type UniverseSessionMetadataApiClient = {
  readonly getPlaySessions: (
    universeId: number,
    filterOptions: PlaySessionQueryOptions,
    signal?: AbortSignal,
  ) => Promise<readonly UniversePlaySession[]>;
  readonly getSessionPlacesWithVersions: (
    universeId: number,
    signal?: AbortSignal,
  ) => Promise<readonly UniverseSessionPlace[]>;
};

const parseEnum = <TEnum extends string>(
  enumObject: { readonly [key: string]: TEnum },
  value: string | null | undefined,
  fallbackValue: TEnum,
): TEnum => {
  return value != null && isValidEnumValue(enumObject, value) ? value : fallbackValue;
};

const parseOptionalEnum = <TEnum extends string>(
  enumObject: { readonly [key: string]: TEnum },
  value: string | null | undefined,
): TEnum | null => {
  return value != null && isValidEnumValue(enumObject, value) ? value : null;
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
    placeName: raw.placeName == null || raw.placeName === '' ? null : raw.placeName,
    placeVersion: raw.placeVersion ?? null,
    playerId: raw.playerId ?? null,
    jobId: raw.jobId ?? null,
    platform: parseOptionalEnum(UniverseSessionPlatform, raw.platform),
    os: parseEnum(UniverseSessionOperatingSystem, raw.os, UniverseSessionOperatingSystem.Unknown),
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
  };
};

export const parseUniverseSessionPlace = (
  raw: RawUniverseSessionPlace,
): UniverseSessionPlace | null => {
  if (raw.placeId == null || raw.placeId.trim() === '') {
    return null;
  }

  return {
    placeId: raw.placeId,
    placeName: raw.placeName == null || raw.placeName === '' ? null : raw.placeName,
    versions: (raw.versions ?? []).filter((version) => Number.isFinite(version)),
  };
};

export const parseUniverseSessionPlacesWithVersionsResponse = (
  raw: RawUniverseSessionPlacesResponse,
): readonly UniverseSessionPlace[] => {
  const places = raw.places ?? [];
  if (!Array.isArray(places)) {
    throw new TypeError('Session places response has a malformed places field.');
  }

  return places
    .map((place) => parseUniverseSessionPlace(place))
    .filter((place): place is UniverseSessionPlace => place !== null);
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
const placeApi = new PlaceApi(configuration);

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

const getSessionPlacesWithVersions = async (
  universeId: number,
  signal?: AbortSignal,
): Promise<readonly UniverseSessionPlace[]> => {
  const rawResponse = await placeApi.placeGetSessionPlacesWithVersions({ universeId }, { signal });
  return parseUniverseSessionPlacesWithVersionsResponse(rawResponse);
};

const universeSessionMetadataClient: UniverseSessionMetadataApiClient = {
  getPlaySessions,
  getSessionPlacesWithVersions,
};

export default universeSessionMetadataClient;

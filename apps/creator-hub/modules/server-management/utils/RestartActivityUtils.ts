import type { RestartStatus, PlaceRestartStatus } from '@rbx/client-server-management-service/v1';
import { RestartState } from '@rbx/client-server-management-service/v1';
import { UI_CONSTANTS, DEFAULT_VALUES, DATE_FORMAT_CONSTANTS } from '../constants';
import type { PlaceInfo } from '../types/PlaceInfo';

/** Phase of a game update for restart status display */
export type RestartStatusPhase = 'inProgress' | 'completed' | 'unknown';

/** Place summary used in restart activity lists */
export type RestartPlace = {
  name: string;
  id: number;
  version: string;
};

/** Place list with visibility and total count */
export type RestartPlaceData = {
  visiblePlaces: RestartPlace[];
  hasMore: boolean;
  totalPlaces: number;
};

/** Parameters for getStatusDisplay */
export interface GetStatusDisplayParams {
  update: RestartStatus;
  translate: (key: string, params?: Record<string, string>) => string;
  getIndicatorClass: (phase: RestartStatusPhase) => string;
}

/** Parameters for getPlacesList */
export interface GetPlacesParams {
  update: RestartStatus;
  placesInfo: PlaceInfo[];
  translate: (key: string, params?: Record<string, string>) => string;
}

/** Parameters for getAllPlaces */
export interface GetAllPlacesParams extends GetPlacesParams {
  places: RestartPlace[];
}

/**
 * Formats a restart start time for display, or returns 'N/A' if missing.
 *
 * @param startTime - Start time as ms or Date
 * @param translate - Translation function
 * @returns Localized "date at time" string or 'N/A'
 */
export function formatStartTime(
  startTime: number | Date | undefined,
  translate: (key: string, params?: Record<string, string>) => string,
): string {
  if (startTime == null) {
    return 'N/A';
  }
  const d = startTime instanceof Date ? startTime : new Date(startTime);
  const date = d.toLocaleDateString(
    DATE_FORMAT_CONSTANTS.LOCALE,
    DATE_FORMAT_CONSTANTS.DATE_OPTIONS,
  );
  // en-US inserts a space (or narrow nbsp) before AM/PM; squash for denser table cells
  const time = d
    .toLocaleTimeString(DATE_FORMAT_CONSTANTS.LOCALE, DATE_FORMAT_CONSTANTS.TIME_OPTIONS)
    .replaceAll(/\u202F|\s+(?=[AP]M\b)/gi, '');
  return translate('RestartActivityCard.DateAtTime', { date, time });
}

/**
 * Returns the display text and indicator CSS class for a restart's status.
 * Uses translate for text and getIndicatorClass(phase) for the status indicator style.
 *
 * @param params - update, translate, and getIndicatorClass(phase) mapper
 * @returns Object with text and indicatorClass for the status chip
 */
export function getStatusDisplay(params: GetStatusDisplayParams): {
  text: string;
  indicatorClass: string;
} {
  const { update, translate, getIndicatorClass } = params;
  const placeStatuses = Object.values(update.placeRestartStatuses ?? {});

  if (placeStatuses.length === 0) {
    return {
      text: translate('RestartActivityCard.Unknown'),
      indicatorClass: getIndicatorClass('unknown'),
    };
  }

  const states = placeStatuses
    .map((status: PlaceRestartStatus) => status.state)
    .filter((state): state is RestartState => state !== null && state !== undefined);

  if (states.length === 0) {
    return {
      text: translate('RestartActivityCard.Unknown'),
      indicatorClass: getIndicatorClass('unknown'),
    };
  }

  const hasInProgressServers = states.some(
    (state) => state === RestartState.Delaying || state === RestartState.Restarting,
  );
  const allServersDone = states.every((state) => state === RestartState.Succeeded);

  if (hasInProgressServers) {
    return {
      text: translate('RestartActivityCard.InProgress'),
      indicatorClass: getIndicatorClass('inProgress'),
    };
  }
  if (allServersDone) {
    return {
      text: translate('RestartActivityCard.Completed'),
      indicatorClass: getIndicatorClass('completed'),
    };
  }
  return {
    text: translate('RestartActivityCard.Unknown'),
    indicatorClass: getIndicatorClass('unknown'),
  };
}

/**
 * Computes restart progress as a percentage (0–100) from place restart statuses.
 * When bleed-off is enabled (scheduledTime !== startTime), progress weights
 * delaying and restarting phases equally; otherwise only restarting counts.
 *
 * @param update - The restart status
 * @returns Progress percentage from 0 to 100
 */
export function getProgress(update: RestartStatus): number {
  const placeStatuses = Object.values(update.placeRestartStatuses ?? {});
  if (placeStatuses.length === 0) {
    return 0;
  }

  const bleedOffEnabled =
    update.scheduledTime &&
    update.startTime &&
    new Date(update.scheduledTime).getTime() !== new Date(update.startTime).getTime();

  const { totalServers, serversInBleedoff, serversMigrating } = placeStatuses.reduce(
    (acc, placeStatus) => {
      const start = placeStatus.totalInstances ?? 0;
      const current = placeStatus.remainingInstances ?? 0;
      acc.totalServers += start;
      if (placeStatus.state === RestartState.Delaying) {
        acc.serversInBleedoff += current;
      } else if (placeStatus.state === RestartState.Restarting) {
        acc.serversMigrating += current;
      }
      return acc;
    },
    { totalServers: 0, serversInBleedoff: 0, serversMigrating: 0 },
  );

  if (totalServers === 0) {
    return 0;
  }

  if (bleedOffEnabled) {
    return (
      (1 - (serversInBleedoff / totalServers) * 0.5 - (serversMigrating / totalServers) * 0.5) * 100
    );
  }
  return (1 - serversMigrating / totalServers) * 100;
}

/**
 * Builds the visible place list for a restart: first N places plus total count and hasMore flag.
 * Resolves place names from placesInfo and uses translate for the place-id placeholder when missing.
 *
 * @param params - update, placesInfo, and translate
 * @returns RestartPlaceData with visiblePlaces, totalPlaces, and hasMore
 */
export function getPlacesList(params: GetPlacesParams): RestartPlaceData {
  const { update, placesInfo, translate } = params;
  const placeEntries = Object.entries(update.placeRestartStatuses ?? {});
  const places: RestartPlace[] = placeEntries.map(
    ([placeIdKey, status]: [string, PlaceRestartStatus]) => {
      const placeId = Number(placeIdKey);
      const placeInfo = placesInfo.find((place) => place.placeId === placeId);
      // empty name should fall through to the place-id placeholder
      const placeName =
        placeInfo?.name != null && placeInfo.name !== ''
          ? placeInfo.name
          : translate('RestartActivityCard.PlaceIdHolder', {
              placeId: placeIdKey,
            });
      return {
        name: placeName,
        id: placeInfo?.placeId ?? DEFAULT_VALUES.PLACE_ID,
        version: status.latestVersion ?? String(DEFAULT_VALUES.PUBLISHED_VERSION),
      };
    },
  );

  return {
    visiblePlaces: places.slice(0, UI_CONSTANTS.MAX_VISIBLE_PLACES),
    totalPlaces: places.length,
    hasMore: places.length > UI_CONSTANTS.MAX_VISIBLE_PLACES,
  };
}

/**
 * Returns the full list of places for a restart: the given visible places plus the remaining places
 * from placeRestartStatuses, with names resolved from placesInfo and translate for place-id placeholders.
 *
 * @param params - update, places, placesInfo, and translate
 * @returns Array of { id, name, version } for all places
 */
export function getAllPlaces(params: GetAllPlacesParams): RestartPlace[] {
  const { update, places, placesInfo, translate } = params;
  const placeInfoMap = new Map(placesInfo.map((p) => [p.placeId, p.name]));
  return [
    ...places.map((p) => ({
      id: p.id,
      name: p.name,
      version: p.version ?? '0',
    })),
    ...Object.entries(update.placeRestartStatuses ?? {})
      .slice(UI_CONSTANTS.MAX_VISIBLE_PLACES)
      .map(([placeIdKey, status]: [string, PlaceRestartStatus]) => {
        const placeId = Number(placeIdKey);
        const placeName = placeInfoMap.get(placeId);
        return {
          // || intentional: coerce NaN (from invalid placeIdKey) to 0; ?? would pass NaN through
          id: placeId || 0,
          name:
            placeName ??
            translate('RestartActivityCard.PlaceIdHolder', {
              placeId: placeIdKey,
            }),
          version: status.latestVersion ?? '0',
        };
      }),
  ];
}

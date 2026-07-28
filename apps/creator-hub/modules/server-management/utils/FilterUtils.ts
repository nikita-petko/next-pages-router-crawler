import type { GameServerFilters } from '../types/GameServerControls';
import {
  areAllServerStatusesSelected,
  areNoServerStatusesSelected,
  isActiveOnlyServerStatus,
} from './serverStatus';

/**
 * Returns true if the filter has at least one non-default value applied
 * (i.e. there is something meaningful to render as a chip or send to the API).
 */
export function validateFilter(filter: GameServerFilters | undefined): boolean {
  if (!filter) {
    return false;
  }

  const placeVersionEmpty = filter.placeVersion.length === 0;
  const engineVersionEmpty = filter.engineVersion.length === 0;

  const allServerTypes = Object.values(filter.serverType).every((v) => v);
  const noServerTypes = Object.values(filter.serverType).every((v) => !v);
  const serverTypesInvalid = allServerTypes || noServerTypes;

  const noServerStatuses = areNoServerStatusesSelected(filter.serverStatus);
  const allServerStatuses = areAllServerStatusesSelected(filter.serverStatus);
  const serverStatusesInvalid = noServerStatuses || allServerStatuses;

  const frameRateUndefined =
    filter.frameRate.min === undefined && filter.frameRate.max === undefined;
  const memoryUsedUndefined =
    filter.memoryUsed.min === undefined && filter.memoryUsed.max === undefined;
  const occupancyUndefined =
    filter.occupancy.min === undefined && filter.occupancy.max === undefined;

  return !(
    placeVersionEmpty &&
    engineVersionEmpty &&
    serverTypesInvalid &&
    serverStatusesInvalid &&
    frameRateUndefined &&
    memoryUsedUndefined &&
    occupancyUndefined
  );
}

/**
 * Returns true if the current filter state is compatible with a server restart
 * operation. Restarts only support place-version filtering; any other active
 * filter (engine version, server type subset, server status subset, or numeric
 * range) makes a restart non-viable.
 *
 * Active-only status is treated as the default (restarts only target live
 * servers). Selecting all statuses is also allowed.
 *
 * When `validPlaceVersions` is provided, every selected place-version must
 * appear in that list; otherwise the filter is considered non-viable.
 * A `null` or `undefined` value means all place versions are allowed.
 */
export function isFilterRestartViable(
  filter: GameServerFilters | undefined,
  validPlaceVersions?: string[] | null,
): boolean {
  if (!filter) {
    return true;
  }

  if (filter.engineVersion && filter.engineVersion.length > 0) {
    return false;
  }

  if (filter.serverType) {
    const allServerTypesDefault = Object.values(filter.serverType).every((v) => v === true);
    if (!allServerTypesDefault) {
      return false;
    }
  }
  if (filter.serverStatus) {
    const isDefaultStatus =
      areAllServerStatusesSelected(filter.serverStatus) ||
      isActiveOnlyServerStatus(filter.serverStatus);
    if (!isDefaultStatus) {
      return false;
    }
  }

  if (
    filter.frameRate &&
    (filter.frameRate.min !== undefined || filter.frameRate.max !== undefined)
  ) {
    return false;
  }
  if (
    filter.memoryUsed &&
    (filter.memoryUsed.min !== undefined || filter.memoryUsed.max !== undefined)
  ) {
    return false;
  }
  if (
    filter.occupancy &&
    (filter.occupancy.min !== undefined || filter.occupancy.max !== undefined)
  ) {
    return false;
  }

  if (
    validPlaceVersions != null &&
    filter.placeVersion.length > 0 &&
    !filter.placeVersion.every((v) => validPlaceVersions.includes(v))
  ) {
    return false;
  }

  return true;
}

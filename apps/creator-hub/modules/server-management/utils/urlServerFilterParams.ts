import type { NextRouter } from 'next/router';
import type { SortOrder } from '../components/ServerListPage/ServerListTable';
import type { GameServerFilters } from '../types/GameServerControls';
import {
  isActiveOnlyServerStatus,
  parseServerStatusFromUrl,
  SERVER_STATUS_FILTER_KEYS,
} from './serverStatus';
import { getQueryString, parseRange, rangeToEntries, replaceUrlParams } from './urlParamsShared';

const PAGE_MANAGED_KEYS = [
  'search',
  'placeVersion',
  'engineVersion',
  'serverType',
  'serverStatus',
  'frameRateMin',
  'frameRateMax',
  'memoryUsedMin',
  'memoryUsedMax',
  'occupancyMin',
  'occupancyMax',
] as const;

const TABLE_MANAGED_KEYS = ['sortBy', 'sortOrder', 'rowsPerPage'] as const;

const TABLE_DEFAULTS = {
  sortBy: 'create_time',
  sortOrder: 'desc',
  rowsPerPage: 10,
} as const satisfies {
  sortBy: string;
  sortOrder: SortOrder;
  rowsPerPage: number;
};

const ALL_SERVER_TYPES = ['public', 'reserved', 'vip', 'teamCreate', 'teamTest'] as const;

function filterToParams(filter: GameServerFilters | undefined): Record<string, string> {
  if (!filter) {
    return {};
  }

  const entries: [string, string][] = [];

  if (filter.placeVersion.length > 0) {
    entries.push(['placeVersion', filter.placeVersion.join(',')]);
  }
  if (filter.engineVersion.length > 0) {
    entries.push(['engineVersion', filter.engineVersion.join(',')]);
  }

  if (filter.serverType) {
    const enabled = ALL_SERVER_TYPES.filter((t) => filter.serverType[t]);
    const allEnabled = enabled.length === ALL_SERVER_TYPES.length;
    const noneEnabled = enabled.length === 0;
    if (noneEnabled) {
      // distinct from omitted (= all selected) so deselect-all survives reload
      entries.push(['serverType', 'none']);
    } else if (!allEnabled) {
      entries.push(['serverType', enabled.join(',')]);
    }
  }

  if (filter.serverStatus) {
    const enabled = SERVER_STATUS_FILTER_KEYS.filter((status) => filter.serverStatus[status]);
    const noneEnabled = enabled.length === 0;
    if (!noneEnabled && !isActiveOnlyServerStatus(filter.serverStatus)) {
      entries.push(['serverStatus', enabled.join(',')]);
    }
  }

  entries.push(
    ...rangeToEntries('frameRate', filter.frameRate),
    ...rangeToEntries('memoryUsed', filter.memoryUsed),
    ...rangeToEntries('occupancy', filter.occupancy),
  );

  return Object.fromEntries(entries);
}

export function syncServerFilterStateToUrl(
  router: NextRouter,
  state: { search: string; filter: GameServerFilters | undefined },
) {
  const params: Record<string, string> = {
    ...(state.search ? { search: state.search } : {}),
    ...filterToParams(state.filter),
  };
  replaceUrlParams(router, params, PAGE_MANAGED_KEYS);
}

export function urlParamsToServerFilter(
  query: Record<string, string | string[] | undefined>,
): GameServerFilters | undefined {
  const hasAny = PAGE_MANAGED_KEYS.some(
    (key) => key !== 'search' && getQueryString(query, key) != null,
  );
  if (!hasAny) {
    return undefined;
  }

  const placeVersionRaw = getQueryString(query, 'placeVersion');
  const engineVersionRaw = getQueryString(query, 'engineVersion');
  const serverTypeRaw = getQueryString(query, 'serverType');
  const serverStatusRaw = getQueryString(query, 'serverStatus');

  const noneServerTypes = serverTypeRaw === 'none' || serverTypeRaw === '';
  const serverTypeSet =
    serverTypeRaw && !noneServerTypes ? new Set(serverTypeRaw.split(',')) : null;

  return {
    placeVersion: placeVersionRaw ? placeVersionRaw.split(',') : [],
    engineVersion: engineVersionRaw ? engineVersionRaw.split(',') : [],
    serverType: {
      public: noneServerTypes ? false : serverTypeSet ? serverTypeSet.has('public') : true,
      reserved: noneServerTypes ? false : serverTypeSet ? serverTypeSet.has('reserved') : true,
      vip: noneServerTypes ? false : serverTypeSet ? serverTypeSet.has('vip') : true,
      teamCreate: noneServerTypes ? false : serverTypeSet ? serverTypeSet.has('teamCreate') : true,
      teamTest: noneServerTypes ? false : serverTypeSet ? serverTypeSet.has('teamTest') : true,
    },
    serverStatus: parseServerStatusFromUrl(serverStatusRaw),
    frameRate: parseRange(query, 'frameRate'),
    memoryUsed: parseRange(query, 'memoryUsed'),
    occupancy: parseRange(query, 'occupancy'),
  };
}

export function syncTableStateToUrl(
  router: NextRouter,
  state: { sortBy: string; sortOrder: SortOrder; rowsPerPage: number },
) {
  const params: Record<string, string> = {};
  if (state.sortBy !== TABLE_DEFAULTS.sortBy) {
    params.sortBy = state.sortBy;
  }
  if (state.sortOrder !== TABLE_DEFAULTS.sortOrder) {
    params.sortOrder = state.sortOrder;
  }
  if (state.rowsPerPage !== TABLE_DEFAULTS.rowsPerPage) {
    params.rowsPerPage = String(state.rowsPerPage);
  }
  replaceUrlParams(router, params, TABLE_MANAGED_KEYS);
}

export function urlParamsToTableState(query: Record<string, string | string[] | undefined>): {
  sortBy?: string;
  sortOrder?: SortOrder;
  rowsPerPage?: number;
} {
  const sortBy = getQueryString(query, 'sortBy');
  const sortOrderRaw = getQueryString(query, 'sortOrder');
  const rowsPerPageRaw = getQueryString(query, 'rowsPerPage');

  const sortOrder = sortOrderRaw === 'asc' || sortOrderRaw === 'desc' ? sortOrderRaw : undefined;
  const rowsPerPage = rowsPerPageRaw != null ? parseInt(rowsPerPageRaw, 10) : undefined;

  return {
    sortBy: sortBy ?? undefined,
    sortOrder,
    rowsPerPage: rowsPerPage != null && !Number.isNaN(rowsPerPage) ? rowsPerPage : undefined,
  };
}

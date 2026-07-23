import type { NextRouter } from 'next/router';
import type { GameServerFilters, NumberRange } from '../types/GameServerControls';
import type { SortOrder } from '../components/ServerListPage/ServerListTable';

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
  sortOrder: 'asc' as SortOrder,
  rowsPerPage: 10,
};

const ALL_SERVER_TYPES = ['public', 'reserved', 'vip'] as const;
const ALL_SERVER_STATUSES = ['active', 'terminated'] as const;

function getQueryString(
  query: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const val = query[key];
  if (Array.isArray(val)) return val[0];
  return val;
}

function rangeToEntries(prefix: string, range?: NumberRange): [string, string][] {
  const entries: [string, string][] = [];
  if (range?.min != null) entries.push([`${prefix}Min`, String(range.min)]);
  if (range?.max != null) entries.push([`${prefix}Max`, String(range.max)]);
  return entries;
}

function parseRange(
  query: Record<string, string | string[] | undefined>,
  prefix: string,
): NumberRange {
  const min = getQueryString(query, `${prefix}Min`);
  const max = getQueryString(query, `${prefix}Max`);
  return {
    min: min != null ? Number(min) : undefined,
    max: max != null ? Number(max) : undefined,
  };
}

function replaceUrlParams(
  router: NextRouter,
  newParams: Record<string, string>,
  managedKeys: readonly string[],
) {
  const query = { ...router.query };

  managedKeys.forEach((key) => {
    if (key in newParams) {
      query[key] = newParams[key];
    } else {
      delete query[key];
    }
  });

  router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
}

// -- Page-level (search + filter) --

function filterToParams(filter: GameServerFilters | undefined): Record<string, string> {
  if (!filter) return {};

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
    if (!allEnabled && !noneEnabled) {
      entries.push(['serverType', enabled.join(',')]);
    }
  }

  if (filter.serverStatus) {
    const enabled = ALL_SERVER_STATUSES.filter((s) => filter.serverStatus[s]);
    const allEnabled = enabled.length === ALL_SERVER_STATUSES.length;
    const noneEnabled = enabled.length === 0;
    if (!allEnabled && !noneEnabled) {
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

export function syncPageStateToUrl(
  router: NextRouter,
  state: { search: string; filter: GameServerFilters | undefined },
) {
  const params: Record<string, string> = {
    ...(state.search ? { search: state.search } : {}),
    ...filterToParams(state.filter),
  };
  replaceUrlParams(router, params, PAGE_MANAGED_KEYS);
}

export function urlParamsToFilter(
  query: Record<string, string | string[] | undefined>,
): GameServerFilters | undefined {
  const hasAny = PAGE_MANAGED_KEYS.some(
    (key) => key !== 'search' && getQueryString(query, key) != null,
  );
  if (!hasAny) return undefined;

  const placeVersionRaw = getQueryString(query, 'placeVersion');
  const engineVersionRaw = getQueryString(query, 'engineVersion');
  const serverTypeRaw = getQueryString(query, 'serverType');
  const serverStatusRaw = getQueryString(query, 'serverStatus');

  const serverTypeSet = serverTypeRaw ? new Set(serverTypeRaw.split(',')) : null;
  const serverStatusSet = serverStatusRaw ? new Set(serverStatusRaw.split(',')) : null;

  return {
    placeVersion: placeVersionRaw ? placeVersionRaw.split(',') : [],
    engineVersion: engineVersionRaw ? engineVersionRaw.split(',') : [],
    serverType: {
      public: serverTypeSet ? serverTypeSet.has('public') : true,
      reserved: serverTypeSet ? serverTypeSet.has('reserved') : true,
      vip: serverTypeSet ? serverTypeSet.has('vip') : true,
    },
    serverStatus: {
      active: serverStatusSet ? serverStatusSet.has('active') : true,
      terminated: serverStatusSet ? serverStatusSet.has('terminated') : true,
    },
    frameRate: parseRange(query, 'frameRate'),
    memoryUsed: parseRange(query, 'memoryUsed'),
    occupancy: parseRange(query, 'occupancy'),
  };
}

// -- Table-level (sort + pagination) --

export function syncTableStateToUrl(
  router: NextRouter,
  state: { sortBy: string; sortOrder: SortOrder; rowsPerPage: number },
) {
  const params: Record<string, string> = {};
  if (state.sortBy !== TABLE_DEFAULTS.sortBy) params.sortBy = state.sortBy;
  if (state.sortOrder !== TABLE_DEFAULTS.sortOrder) params.sortOrder = state.sortOrder;
  if (state.rowsPerPage !== TABLE_DEFAULTS.rowsPerPage)
    params.rowsPerPage = String(state.rowsPerPage);
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

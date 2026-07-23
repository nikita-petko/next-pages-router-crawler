import type { NextRouter } from 'next/router';
import type { NumberRange } from '../types/GameServerControls';

export function getQueryString(
  query: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const val = query[key];
  if (Array.isArray(val)) {
    return val[0];
  }
  return val;
}

export function rangeToEntries(prefix: string, range?: NumberRange): [string, string][] {
  const entries: [string, string][] = [];
  if (range?.min != null) {
    entries.push([`${prefix}Min`, String(range.min)]);
  }
  if (range?.max != null) {
    entries.push([`${prefix}Max`, String(range.max)]);
  }
  return entries;
}

export function parseRange(
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

function queryValueAsString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export function replaceUrlParams(
  router: NextRouter,
  newParams: Record<string, string>,
  managedKeys: readonly string[],
) {
  const query = { ...router.query };
  let changed = false;

  managedKeys.forEach((key) => {
    if (key in newParams) {
      if (queryValueAsString(query[key]) !== newParams[key]) {
        query[key] = newParams[key];
        changed = true;
      }
    } else if (key in query) {
      delete query[key];
      changed = true;
    }
  });

  if (!changed) {
    return;
  }

  void router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
}

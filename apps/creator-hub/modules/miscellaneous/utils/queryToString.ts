import type { ParsedUrlQuery } from 'node:querystring';

/**
 * Normalizes a single query param to a string. A repeated param (`?a=1&a=2`) parses as an array, so
 * reading one without collapsing it silently yields an array where a string is expected.
 */
export function readQueryValue(value: string | string[] | undefined | null): string | undefined {
  if (value == null) {
    return undefined;
  }
  return Array.isArray(value) ? value.at(0) : value;
}

function queryToString(query: ParsedUrlQuery): Record<string, string | undefined> {
  return Object.entries(query).reduce<Record<string, string | undefined>>((acc, [key, value]) => {
    if (Array.isArray(value)) {
      acc[key] = value.at(0);
      return acc;
    }
    acc[key] = value;
    return acc;
  }, {});
}

export default queryToString;

import type { ParsedUrlQuery } from 'node:querystring';

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

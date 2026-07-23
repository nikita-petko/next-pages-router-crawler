import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import RAQIV2ReservedDimensionValues from './RAQIV2ReservedDimensionValues';

/**
 * RAQI reserved sentinel values (e.g. `RAQI_RESERVED_DIMENSION_VALUES_UNKNOWN`,
 * `RAQI_RESERVED_DIMENSION_VALUES_NO_VALUE`) appear in API responses to mark
 * rows where the underlying dimension had no real value (e.g. unknown
 * platform). They are display-only and are NOT valid filter inputs — sending
 * them to the druid-backed query results in a 500.
 *
 * Use this at the gateway boundary so every code path (table row drill-down,
 * chart filter chips, URL state, etc.) is protected without having to
 * remember the rule at each call site.
 *
 * The `values` field is typed as optional because the gateway SDK's filter
 * type carries `values?: readonly string[]` (notably the per-node DAG
 * filters fed in via `sanitizeDagRequest`); a missing `values` is treated
 * the same as an empty array — the caller should drop the filter.
 *
 * Returns:
 * - `null` if the filter has no remaining values after stripping (so the
 *   caller can drop it; an empty / missing `values` is also rejected by the
 *   backend).
 * - the same filter reference when `values` was defined and nothing was
 *   stripped (a fast path that avoids unnecessary copies for the common
 *   case where filters contain no reserved sentinels).
 * - a new filter with the cleaned `values` array otherwise.
 */
const sanitizeFilterValuesForBackend = <T extends { values?: readonly string[] }>(
  filter: T,
): T | null => {
  const values = filter.values ?? [];
  const cleanValues = values.filter(
    (value) => !isValidEnumValue(RAQIV2ReservedDimensionValues, value),
  );
  if (cleanValues.length === 0) {
    return null;
  }
  if (cleanValues.length === values.length && filter.values !== undefined) {
    return filter;
  }
  return { ...filter, values: cleanValues };
};

/**
 * Applies {@link sanitizeFilterValuesForBackend} across an entire filter
 * list, dropping any filter that becomes empty.
 */
export const sanitizeFilterListForBackend = <T extends { values?: readonly string[] }>(
  filters: readonly T[] | undefined,
): T[] | undefined => {
  if (!filters) {
    return filters;
  }
  const result: T[] = [];
  filters.forEach((filter) => {
    const cleaned = sanitizeFilterValuesForBackend(filter);
    if (cleaned !== null) {
      result.push(cleaned);
    }
  });
  return result;
};

export default sanitizeFilterValuesForBackend;

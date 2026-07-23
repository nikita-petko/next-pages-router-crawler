/**
 * Query Parameter Parsers
 *
 * Utility functions for parsing analytics query parameters from URL strings.
 * These parsers return undefined for invalid or missing values, allowing
 * consumers to apply their own defaults.
 */

import { DateRangeType } from '@modules/charts-generic';
import {
  TRAQIV2BreakdownDimension,
  isSupportedBreakdownDimension,
  AnnotationType,
} from '@modules/clients/analytics';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { TUIGranularity } from '../../utils/seriesGranularities';
import { QueryParamGranularity } from '../AnalyticsCurrentGranularityProvider';

export type ParsedQueryParam = string | string[] | null | undefined;

// Query param granularity to UI granularity mapping
export const queryGranularityToUIGranularity: Record<QueryParamGranularity, TUIGranularity> = {
  [QueryParamGranularity.Monthly]: RAQIV2MetricGranularity.OneMonth,
  [QueryParamGranularity.Weekly]: RAQIV2MetricGranularity.OneWeek,
  [QueryParamGranularity.Daily]: RAQIV2MetricGranularity.OneDay,
  [QueryParamGranularity.Hourly]: RAQIV2MetricGranularity.OneHour,
  [QueryParamGranularity.Minutely]: RAQIV2MetricGranularity.OneMinute,
  [QueryParamGranularity.ThirtyMinutely]: RAQIV2MetricGranularity.HalfHour,
  [QueryParamGranularity.Cumulative]: RAQIV2MetricGranularity.None,
};

/**
 * Parse date range type from query param, returning undefined if invalid or not set.
 */
export function parseRangeType(value: ParsedQueryParam): DateRangeType | undefined {
  if (!value || typeof value !== 'string') return undefined;
  if (isValidEnumValue(DateRangeType, value)) {
    return value;
  }
  return undefined;
}

/**
 * Parse timestamp from query param, returning undefined if invalid or not set.
 */
export function parseTimestamp(value: ParsedQueryParam): number | undefined {
  if (!value) return undefined;
  const strValue = Array.isArray(value) ? value[0] : value;
  const parsed = parseInt(strValue, 10);
  if (Number.isNaN(parsed)) return undefined;
  return parsed;
}

/**
 * Parse breakdown dimensions from query param, returning undefined if not set.
 * Returns empty array if set but no valid dimensions found.
 */
export function parseBreakdown(value: ParsedQueryParam): TRAQIV2BreakdownDimension[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    const parsed = value.filter((dim): dim is TRAQIV2BreakdownDimension =>
      isSupportedBreakdownDimension(dim),
    );
    return parsed.length > 0 ? parsed : [];
  }
  if (isSupportedBreakdownDimension(value)) {
    return [value];
  }
  return [];
}

/**
 * Parse granularity from query param, returning undefined if not set or invalid.
 */
export function parseGranularity(value: ParsedQueryParam): TUIGranularity | undefined {
  if (!value || typeof value !== 'string') return undefined;
  if (isValidEnumValue(QueryParamGranularity, value)) {
    return queryGranularityToUIGranularity[value];
  }
  return undefined;
}

/**
 * Parse single date type from query param.
 */
export function parseSingleDateType(value: ParsedQueryParam): string | undefined {
  if (!value || typeof value !== 'string') return undefined;
  return value;
}

/**
 * Parse annotations from query param, returning undefined if not set.
 * Accepts both AnnotationType values and 'None' (indicating explicit disable).
 */
export function parseAnnotations(
  value: ParsedQueryParam,
): Array<AnnotationType | 'None'> | undefined {
  if (!value) return undefined;
  const values = Array.isArray(value) ? value : [value];
  const parsed = values.filter(
    (v): v is AnnotationType | 'None' => v === 'None' || isValidEnumValue(AnnotationType, v),
  );
  return parsed.length > 0 ? parsed : undefined;
}

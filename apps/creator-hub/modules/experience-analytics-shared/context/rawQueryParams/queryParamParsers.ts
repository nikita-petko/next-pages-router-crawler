/**
 * Query Parameter Parsers
 *
 * Utility functions for parsing analytics query parameters from URL strings.
 * These parsers return undefined for invalid or missing values, allowing
 * consumers to apply their own defaults.
 */

import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { AnnotationType } from '@modules/clients/analytics/annotations/annotations';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import type { TUIGranularity } from '../../utils/seriesGranularities';
import { QueryParamGranularity } from '../AnalyticsCurrentGranularityProvider';

export type ParsedQueryParam = string | string[] | null | undefined;

const isSupportedDimension = (value: string): value is TRAQIV2Dimension =>
  isValidEnumValue(RAQIV2Dimension, value) || isValidEnumValue(RAQIV2UIPseudoDimension, value);

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
export function parseRangeType(value: ParsedQueryParam): RAQIV2DateRangeType | undefined {
  if (!value || typeof value !== 'string') {
    return undefined;
  }
  if (isValidEnumValue(RAQIV2DateRangeType, value)) {
    return value;
  }
  return undefined;
}

/**
 * Parse timestamp from query param, returning undefined if invalid or not set.
 */
export function parseTimestamp(value: ParsedQueryParam): number | undefined {
  if (!value) {
    return undefined;
  }
  const strValue = Array.isArray(value) ? value[0] : value;
  const parsed = parseInt(strValue, 10);
  if (Number.isNaN(parsed)) {
    return undefined;
  }
  return parsed;
}

/**
 * Sentinel value written to the URL when the user explicitly selects "None"
 * in the breakdown dropdown. Distinguishes that intent from "no breakdown
 * param in the URL" (in which case page-config defaults should apply).
 */
export const BREAKDOWN_NONE_SENTINEL = 'None';

/**
 * Parse breakdown dimensions from query param.
 *
 * Returns:
 *   - `undefined` when the param is absent (callers should apply defaults)
 *   - `[]` when the param is the explicit "None" sentinel, or when only
 *     unsupported dimensions are present
 *   - the supported dimensions otherwise
 */
export function parseBreakdown(value: ParsedQueryParam): TRAQIV2Dimension[] | undefined {
  if (!value) {
    return undefined;
  }
  if (Array.isArray(value)) {
    if (value.length === 1 && value[0] === BREAKDOWN_NONE_SENTINEL) {
      return [];
    }
    const parsed = value.filter((dim): dim is TRAQIV2Dimension => isSupportedDimension(dim));
    return parsed.length > 0 ? parsed : [];
  }
  if (value === BREAKDOWN_NONE_SENTINEL) {
    return [];
  }
  if (isSupportedDimension(value)) {
    return [value];
  }
  return [];
}

/**
 * Parse granularity from query param, returning undefined if not set or invalid.
 */
export function parseGranularity(value: ParsedQueryParam): TUIGranularity | undefined {
  if (!value || typeof value !== 'string') {
    return undefined;
  }
  if (isValidEnumValue(QueryParamGranularity, value)) {
    return queryGranularityToUIGranularity[value];
  }
  return undefined;
}

/**
 * Parse single date type from query param.
 */
export function parseSingleDateType(value: ParsedQueryParam): string | undefined {
  if (!value || typeof value !== 'string') {
    return undefined;
  }
  return value;
}

/**
 * Parse annotations from query param, returning undefined if not set.
 * Accepts both AnnotationType values and 'None' (indicating explicit disable).
 */
export function parseAnnotations(
  value: ParsedQueryParam,
): Array<AnnotationType | 'None'> | undefined {
  if (!value) {
    return undefined;
  }
  const values = Array.isArray(value) ? value : [value];
  const parsed = values.filter(
    (v): v is AnnotationType | 'None' => v === 'None' || isValidEnumValue(AnnotationType, v),
  );
  return parsed.length > 0 ? parsed : undefined;
}

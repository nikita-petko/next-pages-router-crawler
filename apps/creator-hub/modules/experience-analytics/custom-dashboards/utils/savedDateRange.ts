import { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';

export const CUSTOM_DASHBOARD_SAVED_DATE_RANGE_LIMIT_DAYS = 56;

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const CUSTOM_DASHBOARD_SAVED_DATE_RANGE_LIMIT_MS =
  CUSTOM_DASHBOARD_SAVED_DATE_RANGE_LIMIT_DAYS * MILLISECONDS_PER_DAY;
const CUSTOM_DASHBOARD_EDITOR_MAX_RANGE_DURATION_MS =
  (CUSTOM_DASHBOARD_SAVED_DATE_RANGE_LIMIT_DAYS - 1) * MILLISECONDS_PER_DAY;

const SUPPORTED_SAVED_DATE_RANGE_TYPES: ReadonlySet<RAQIV2DateRangeType> = new Set([
  RAQIV2DateRangeType.Last1Hour,
  RAQIV2DateRangeType.Last1Day,
  RAQIV2DateRangeType.Last3Days,
  RAQIV2DateRangeType.Last7Days,
  RAQIV2DateRangeType.Last28Days,
  // This preset spans 55 days between its inclusive start/end timestamps.
  RAQIV2DateRangeType.Last56Days,
  RAQIV2DateRangeType.Custom,
]);

export function isSupportedCustomDashboardSavedDateRangeType(
  rangeType: RAQIV2DateRangeType,
): boolean {
  return SUPPORTED_SAVED_DATE_RANGE_TYPES.has(rangeType);
}

export function filterSupportedCustomDashboardSavedDateRangeTypes(
  rangeTypes: readonly RAQIV2DateRangeType[],
): RAQIV2DateRangeType[] {
  return rangeTypes.filter(isSupportedCustomDashboardSavedDateRangeType);
}

export function isCustomDashboardSavedDateRangeDurationValid(
  startTimeMs: number,
  endTimeMs: number,
): boolean {
  const durationMs = endTimeMs - startTimeMs;
  return durationMs >= 0 && durationMs < CUSTOM_DASHBOARD_SAVED_DATE_RANGE_LIMIT_MS;
}

export function constrainCustomDashboardEditorDateRange(
  startDate: Date,
  endDate: Date,
): { readonly startDate: Date; readonly endDate: Date } {
  if (isCustomDashboardSavedDateRangeDurationValid(startDate.getTime(), endDate.getTime())) {
    return { startDate, endDate };
  }
  return {
    startDate: new Date(endDate.getTime() - CUSTOM_DASHBOARD_EDITOR_MAX_RANGE_DURATION_MS),
    endDate,
  };
}

import { defaultAnalyticsPageSurfaceConfig } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import type {
  AnalyticsPageConfigDateOptions,
  AnalyticsPageConfigDefaultDateRangeSelection,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import type { DashboardDateRangeDefault, DashboardSurfaceControls } from '../types';

/**
 * Maps a dashboard-owned date default onto the page-config selection used by
 * the analytics date-range provider. Chart tiles do not store a date range;
 * `DashboardSurfaceControls.timeRangeOptions` is the source of truth.
 */
export function buildDashboardPageDefaultDateRangeSelection(
  defaultDateRange: DashboardDateRangeDefault | undefined,
): AnalyticsPageConfigDefaultDateRangeSelection | undefined {
  if (!defaultDateRange) {
    return undefined;
  }
  if (defaultDateRange.type === 'Relative') {
    return {
      type: 'Preset',
      rangeType: defaultDateRange.rangeType,
    };
  }
  return {
    type: 'Custom',
    startTime: new Date(defaultDateRange.startTimeMs),
    endTime: new Date(defaultDateRange.endTimeMs),
  };
}

/**
 * Maps a dashboard-owned relative default onto the page-config dropdown
 * default. Custom ranges keep the shared surface options and are applied via
 * {@link buildDashboardPageDefaultDateRangeSelection} instead.
 */
export function buildDashboardPageTimeRangeOptions(
  defaultDateRange: DashboardDateRangeDefault | undefined,
): AnalyticsPageConfigDateOptions {
  const baseTimeRangeOptions = defaultAnalyticsPageSurfaceConfig.timeRangeOptions;
  if (defaultDateRange?.type !== 'Relative' || baseTimeRangeOptions.type !== 'dateRange') {
    return baseTimeRangeOptions;
  }
  return {
    ...baseTimeRangeOptions,
    defaultRange: defaultDateRange.rangeType,
  };
}

export function getDashboardDefaultDateRange(
  controls: DashboardSurfaceControls | undefined,
): DashboardDateRangeDefault | undefined {
  return controls?.timeRangeOptions?.type === 'DateRange'
    ? controls.timeRangeOptions.defaultSelection
    : undefined;
}

/**
 * Page-config date range for a custom dashboard surface, including the chart
 * editor preview. The editor must seed this from dashboard controls so a saved
 * Last 7 days range is not replaced by the shared Last 28 days default.
 */
export function resolveDashboardPageTimeRange(controls: DashboardSurfaceControls | undefined): {
  readonly timeRangeOptions: AnalyticsPageConfigDateOptions;
  readonly defaultDateRangeSelection: AnalyticsPageConfigDefaultDateRangeSelection | undefined;
} {
  const defaultDateRange = getDashboardDefaultDateRange(controls);
  return {
    timeRangeOptions: buildDashboardPageTimeRangeOptions(defaultDateRange),
    defaultDateRangeSelection: buildDashboardPageDefaultDateRangeSelection(defaultDateRange),
  };
}

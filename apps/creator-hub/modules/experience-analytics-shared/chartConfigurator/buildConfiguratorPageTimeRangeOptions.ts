import { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';
import getAnalyticsMetricDisplayConfig from '../constants/AnalyticsMetricDisplayConfig';
import type { AnalyticsPageConfigDateOptions } from '../types/RAQIV2PageConfig';
import type { TChartConfiguratorMetrics } from './chartConfiguratorMetricsConfig';

const EXPLORE_MODE_MIN_START_DATE = new Date('06/01/2023');

type BuildConfiguratorPageTimeRangeOptionsArgs = {
  readonly dateRangeOptions: readonly RAQIV2DateRangeType[];
  readonly displaySourceMetrics: readonly TChartConfiguratorMetrics[];
};

/**
 * Page-config `supportedRanges` for Explore Mode and the chart editor.
 *
 * Uses the selected metric's `exploreMode.supportedDateRangeTypes` intersection
 * (the same list the configurator already computes). The date-range provider
 * then rejects leftover presets on the same render the metric changes.
 *
 * Dashboard canvas pickers keep a shared superset (`DefaultExploreModeDateRanges`)
 * instead — one range for every tile.
 */
export function buildConfiguratorPageTimeRangeOptions({
  dateRangeOptions,
  displaySourceMetrics,
}: BuildConfiguratorPageTimeRangeOptionsArgs): AnalyticsPageConfigDateOptions {
  const baseRanges = [...dateRangeOptions];
  // Always allow Custom: a metric's `supportedDateRangeTypes` enumerates the
  // relative-range presets shown in the picker, but Custom is rendered as a
  // separate calendar entry and is also how deep links from other surfaces
  // pass an explicit min/max time. Without it here, PageConfigAwareDateRange
  // sees `rangeType=Custom` in the URL, treats it as unsupported, and snaps
  // back to the first preset — silently dropping the carried-over range.
  const supportedRanges = baseRanges.includes(RAQIV2DateRangeType.Custom)
    ? baseRanges
    : [...baseRanges, RAQIV2DateRangeType.Custom];
  const defaultRange = supportedRanges.includes(RAQIV2DateRangeType.Last28Days)
    ? RAQIV2DateRangeType.Last28Days
    : (supportedRanges[0] ?? RAQIV2DateRangeType.Last28Days);
  const hasDisabledSourceMetric = displaySourceMetrics.some(
    (metricToCheck) => getAnalyticsMetricDisplayConfig(metricToCheck).exploreMode?.disabled,
  );

  if (hasDisabledSourceMetric) {
    return {
      type: 'dateRange',
      supportedRanges,
      defaultRange,
      excludeEndDateInRange: false,
      maxEndDateOffset: 0,
      maxStartDateOffsetDays: 365,
    };
  }
  return {
    type: 'dateRange',
    supportedRanges,
    defaultRange,
    minStartDate: EXPLORE_MODE_MIN_START_DATE,
  };
}

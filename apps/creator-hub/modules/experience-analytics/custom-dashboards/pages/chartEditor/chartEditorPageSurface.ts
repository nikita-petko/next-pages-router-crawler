import type { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';
import { buildConfiguratorPageTimeRangeOptions } from '@modules/experience-analytics-shared/chartConfigurator/buildConfiguratorPageTimeRangeOptions';
import type { TChartConfiguratorMetrics } from '@modules/experience-analytics-shared/chartConfigurator/chartConfiguratorMetricsConfig';
import type {
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsPageSurfaceConfig,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import type { DashboardSurfaceControls } from '../../types';
import { resolveDashboardPageTimeRange } from '../../utils/dashboardPageTimeRange';

type BuildChartEditorPageSurfaceConfigArgs = {
  readonly resourceTypes: CreatorAnalyticsPageSurfaceConfig['resourceTypes'];
  readonly filterDimensions: CreatorAnalyticsPageSurfaceConfig['filterDimensions'];
  readonly breakdownDimensions: CreatorAnalyticsPageSurfaceConfig['breakdownDimensions'];
  readonly dateRangeOptions: readonly RAQIV2DateRangeType[];
  readonly displaySourceMetrics: readonly TChartConfiguratorMetrics[];
  readonly controls: DashboardSurfaceControls | undefined;
  readonly surfaceAnnotationOptions: AnalyticsPageConfigAnnotationOptions;
};

function mergeEditorPreviewTimeRangeOptions(
  metricTimeRange: AnalyticsPageConfigDateOptions,
  controls: DashboardSurfaceControls | undefined,
): Pick<CreatorAnalyticsPageSurfaceConfig, 'timeRangeOptions' | 'defaultDateRangeSelection'> {
  const dashboardTimeRange = resolveDashboardPageTimeRange(controls);
  if (metricTimeRange.type !== 'dateRange') {
    return dashboardTimeRange;
  }

  const dashboardSelection = dashboardTimeRange.defaultDateRangeSelection;
  const dashboardPreset =
    dashboardSelection?.type === 'Preset' ? dashboardSelection.rangeType : undefined;
  // Keep an unsupported dashboard preset in the allowlist so the provider does
  // not invent Last 28 days. Preview then follows the canvas empty-state /
  // capability-matrix path instead of persisting a snapped range.
  const supportedRanges =
    dashboardPreset && !metricTimeRange.supportedRanges.includes(dashboardPreset)
      ? [...metricTimeRange.supportedRanges, dashboardPreset]
      : metricTimeRange.supportedRanges;
  const defaultRange =
    dashboardTimeRange.timeRangeOptions.type === 'dateRange'
      ? dashboardTimeRange.timeRangeOptions.defaultRange
      : metricTimeRange.defaultRange;

  return {
    timeRangeOptions: {
      ...metricTimeRange,
      supportedRanges,
      defaultRange,
    },
    defaultDateRangeSelection: dashboardSelection,
  };
}

/**
 * Page-config for the chart editor preview.
 *
 * Metric `supportedRanges` come from the Explore Mode intersection (DSA-6134).
 * The preview date is seeded from the dashboard default (DSA-6135), not Last 28.
 * The editor does not own a date picker; metric-switch fallbacks are not written
 * back as the dashboard default.
 */
export function buildChartEditorPageSurfaceConfig({
  resourceTypes,
  filterDimensions,
  breakdownDimensions,
  dateRangeOptions,
  displaySourceMetrics,
  controls,
  surfaceAnnotationOptions,
}: BuildChartEditorPageSurfaceConfigArgs): CreatorAnalyticsPageSurfaceConfig {
  const metricTimeRange = buildConfiguratorPageTimeRangeOptions({
    dateRangeOptions,
    displaySourceMetrics,
  });
  const previewTimeRange = mergeEditorPreviewTimeRangeOptions(metricTimeRange, controls);
  return {
    resourceTypes,
    filterDimensions,
    breakdownDimensions,
    timeRangeOptions: previewTimeRange.timeRangeOptions,
    defaultDateRangeSelection: previewTimeRange.defaultDateRangeSelection,
    surfaceAnnotationOptions,
    body: [],
  };
}

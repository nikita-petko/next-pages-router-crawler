import { RAQIV2Metric, RAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import type { TChartConfiguratorMetrics } from './chartConfiguratorMetricsConfig';

/**
 * Explore-catalog metrics that appear on the Performance page.
 * Identity is page membership, not `Heading.Performance` grouping.
 *
 * Bandwidth charts are on the Network tab but are not exploreMode-enabled, so
 * they are omitted. Rotrace and telemetry-migration aliases are in Explore
 * under a Performance heading when flagged, but they are not on this page, so
 * they are omitted.
 *
 * Keep in sync with `performancePageConfig.ts`. Enforced by
 * `performancePageConfig.test.ts`.
 */
export const chartConfiguratorPerformancePageMetrics: ReadonlySet<TChartConfiguratorMetrics> =
  new Set([
    RAQIV2Metric.ClientCpuTimeAvg,
    RAQIV2Metric.ClientCrashCount,
    RAQIV2Metric.ClientCrashRate15m,
    RAQIV2UIMetric.ClientFps,
    RAQIV2UIMetric.ClientMemoryUsage,
    RAQIV2UIMetric.ClientMemoryUsagePercentage,
    RAQIV2Metric.CpuCoreUtilization,
    RAQIV2Metric.OomUnexpectedExits,
    RAQIV2Metric.PeakConcurrentPlayers,
    RAQIV2UIMetric.ServerCpuTime,
    RAQIV2UIMetric.ServerFrameRate,
    RAQIV2UIMetric.ServerMemoryUsageByServerAge,
    RAQIV2UIMetric.ServerMemoryUsageV2,
    RAQIV2UIMetric.SessionDurationSeconds,
  ]);

export const isChartConfiguratorPerformanceMetric = (metric: TChartConfiguratorMetrics): boolean =>
  chartConfiguratorPerformancePageMetrics.has(metric);

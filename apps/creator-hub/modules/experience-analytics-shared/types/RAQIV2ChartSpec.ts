import { RAQIV2QueryFilter, RAQIV2ChartResource } from '@modules/clients/analytics';
import { TExplicitTimeRangeSpec, TLabeledExplicitTimeRangeSpec } from '@modules/charts-generic';
import { RAQIV2MetricGranularity, TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { type TRAQIV2NumericUIMetric } from '../constants/AnalyticsMetricDisplayConfig';
import type { MetricLike } from './ComputedMetric';
import type { BenchmarkType } from '../constants/BenchmarkType';

interface OverlayVariants {
  benchmark: { benchmarkType?: BenchmarkType };
  comparison: { relativeOffset?: '7d' | '14d' | '28d' };
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- intentionally empty payload
  'trend-line': {};
}

export type OverlaySpec<K extends keyof OverlayVariants = keyof OverlayVariants> = {
  [T in K]: Readonly<{ type: T } & OverlayVariants[T]>;
}[K];

export type OverlayType = OverlaySpec['type'];

export type BenchmarkOverlay = OverlaySpec<'benchmark'>;
export type ComparisonOverlay = OverlaySpec<'comparison'>;
export type TrendLineOverlay = OverlaySpec<'trend-line'>;

/**
 * Array of overlay items to render on a chart.
 *
 * - `undefined` → chart component uses its defaults (comparison when no breakdowns, benchmarks when metric supports them)
 * - `[]` → explicitly no overlays
 * - `[Overlay.benchmark()]` → only benchmarks
 *
 * When runtime code provides overlays, it replaces the defaults entirely (override semantics).
 */
export type ChartOverlays = ReadonlyArray<OverlaySpec>;

export const ChartOverlay = {
  benchmark: (benchmarkType?: BenchmarkType): BenchmarkOverlay => ({
    type: 'benchmark',
    benchmarkType,
  }),
  comparison: (relativeOffset?: ComparisonOverlay['relativeOffset']): ComparisonOverlay => ({
    type: 'comparison',
    relativeOffset,
  }),
  trendLine: (): TrendLineOverlay => ({ type: 'trend-line' }),
} as const;

export const hasOverlay = (overlays: ChartOverlays | undefined, type: OverlayType): boolean =>
  overlays?.some((o) => o.type === type) ?? false;

export const getOverlay = <K extends keyof OverlayVariants>(
  overlays: ChartOverlays | undefined,
  type: K,
): OverlaySpec<K> | undefined =>
  overlays?.find((o) => o.type === type) as OverlaySpec<K> | undefined;

export type RAQIV2ChartDisplayOptions = {
  hideTotalSeriesInChart?: boolean;
  labelDataAsPercent?: boolean;
  tooltipDataAsPercent?: boolean;
};

type RAQIV2ChartSpec = {
  resource: RAQIV2ChartResource;
  timeSpec: TExplicitTimeRangeSpec;
  metric: MetricLike<TRAQIV2NumericUIMetric>;
  breakdown?: readonly TRAQIV2Dimension[];
  filter?: readonly RAQIV2QueryFilter[];
  granularity: RAQIV2MetricGranularity;
  timeAxisBounds: [Date, Date] | null | 'disabled';
  limit?: number;
  benchmarkPercentiles?: [number, number];
  overlays?: ChartOverlays;
  displayOptions?: RAQIV2ChartDisplayOptions;
};

type MetricSpecs = {
  metric: TRAQIV2NumericUIMetric;
  filter?: readonly RAQIV2QueryFilter[];
};

export type RAQIV2MultiMetricsChartSpec = Omit<
  RAQIV2ChartSpec,
  'metric' | 'breakdown' | 'filter'
> & {
  metricSpec: MetricSpecs[];
};

export type RAQIV2TimeComparatorChartSpec = Omit<RAQIV2ChartSpec, 'timeSpec' | 'breakdown'> & {
  labeledTimeSpecs: TLabeledExplicitTimeRangeSpec[];
};

export default RAQIV2ChartSpec;

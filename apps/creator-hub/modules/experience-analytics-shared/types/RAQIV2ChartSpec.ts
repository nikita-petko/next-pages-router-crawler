import type { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type {
  TExplicitTimeRangeSpec,
  TLabeledExplicitTimeRangeSpec,
} from '@modules/charts-generic/charts/types/ChartTypes';
import type { RAQIV2QueryFilter, RAQIV2ChartResource } from '@modules/clients/analytics';
import type { TRAQIV2NumericUIMetric } from '../constants/AnalyticsMetricDisplayConfig';
import type { BenchmarkType } from '../constants/BenchmarkType';
import type { TComparisonOffset } from '../constants/comparisonOffset';
import type { MetricLike } from './ComputedMetric';

interface OverlayVariants {
  benchmark: { benchmarkType?: BenchmarkType };
  comparison: { relativeOffset?: TComparisonOffset; customStartDate?: Date };
  // Quota carries no payload of its own — the chart resolves the actual quota
  // configuration via the dedicated `quotaConfig` prop on RAQIV2GenericChart
  // (sourced from the metric's `quotaConfig` in the developer-analytics display
  // config). This entry exists so quota participates in the overlay union for
  // URL serialization and overlay-picker UI gating.
  quota: {};
}

export type OverlaySpec<K extends keyof OverlayVariants = keyof OverlayVariants> = {
  [T in K]: Readonly<{ type: T } & OverlayVariants[T]>;
}[K];

export type OverlayType = OverlaySpec['type'];
type OverlaySpecForType<K extends OverlayType> = Extract<OverlaySpec, { readonly type: K }>;

export type BenchmarkOverlay = OverlaySpec<'benchmark'>;
export type ComparisonOverlay = OverlaySpec<'comparison'>;
export type QuotaOverlay = OverlaySpec<'quota'>;

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
  comparison: (
    comparisonOptions?: ComparisonOverlay['relativeOffset'] | Omit<ComparisonOverlay, 'type'>,
  ): ComparisonOverlay => {
    if (typeof comparisonOptions === 'string' || comparisonOptions === undefined) {
      return {
        type: 'comparison',
        relativeOffset: comparisonOptions,
      };
    }
    const { relativeOffset, customStartDate } = comparisonOptions;
    return {
      type: 'comparison',
      relativeOffset,
      customStartDate,
    };
  },
  quota: (): QuotaOverlay => ({ type: 'quota' }),
} as const;

export const hasOverlay = (overlays: ChartOverlays | undefined, type: OverlayType): boolean =>
  overlays?.some((o) => o.type === type) ?? false;

export const getOverlay = <K extends OverlayType>(
  overlays: ChartOverlays | undefined,
  type: K,
): OverlaySpecForType<K> | undefined =>
  overlays?.find((overlay): overlay is OverlaySpecForType<K> => overlay.type === type);

export type RAQIV2ChartDisplayOptions = {
  hideTotalSeriesInChart?: boolean;
  labelDataAsPercent?: boolean;
  tooltipDataAsPercent?: boolean;
};

type RAQIV2ChartSpec = {
  resource: RAQIV2ChartResource;
  timeSpec: TExplicitTimeRangeSpec;
  metric: MetricLike;
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

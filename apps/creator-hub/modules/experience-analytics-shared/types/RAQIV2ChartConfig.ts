import type { ChartColor, ChartStyleMode } from '@rbx/analytics-ui';
import type { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { TSystemBannerProps } from '@rbx/foundation-ui';
import type AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import type { TranslationKey } from '@modules/analytics-translations/types';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import type { NonEmptyArray } from '@modules/charts-generic/types/NonEmptyArray';
import type { RAQIV2SummarySpec } from '../adapters/genericRAQIV2ChartSummaryAdapter';
import type { TRAQIV2NumericUIMetric } from '../constants/AnalyticsMetricDisplayConfig';
import type { SpecOverride } from '../utils/computeRAQIV2SpecOverride';
import type { ComparisonConfig } from './ComparisonConfig';
import type { ComputedMetric } from './ComputedMetric';
import type { ChartOverlays } from './RAQIV2ChartSpec';

export type TGenericRAQIV2Sort = {
  byBreakdownTotal?: boolean;
};

export type ChartConfigDisplayOptions = {
  hideTotalSeriesInChart?: boolean;
  // This remains chart-level because bar/map paths use it to determine total-series fetch behavior.
  labelDataAsPercent?: boolean;
  tooltipDataAsPercent?: boolean;
};

export type BarChartDisplayOptions = Pick<ChartConfigDisplayOptions, 'labelDataAsPercent'>;
export type SplineChartDisplayOptions = Pick<ChartConfigDisplayOptions, 'hideTotalSeriesInChart'>;
export type DurationSplineChartDisplayOptions = SplineChartDisplayOptions;
export type PieChartDisplayOptions = Pick<
  ChartConfigDisplayOptions,
  'labelDataAsPercent' | 'tooltipDataAsPercent'
>;

type MetricConfig = {
  metric: TRAQIV2NumericUIMetric;
  overrides: SpecOverride;
};

export enum ChartDisplayContext {
  Scorecard = 'scorecard',
  Explore = 'explore',
  Snapshot = 'snapshot',
}

type ChartConfigBase = MetricConfig & {
  type: AnalyticsComponentType.Chart;
  chartKey?: string;
  titleKey: TranslationKey;
  titleKeyByContext?: Partial<Record<ChartDisplayContext, TranslationKey>>;
  definitionTooltipKey?: TranslationKey;
  chartType: ChartType;
  chartStyleMode?: ChartStyleMode;
  summarySpec?: RAQIV2SummarySpec;
  titleKeyByGranularity?: Partial<Record<RAQIV2MetricGranularity, TranslationKey>>;
  definitionTooltipKeyByGranularity?: Partial<Record<RAQIV2MetricGranularity, TranslationKey>>;
  chartHeight?: number;
  inRoundedComparisonChipContext?: boolean;
  chartBanner?: TSystemBannerProps;
  overlays?: ChartOverlays;
  comparison?: ComparisonConfig;
  // Custom-dashboard authored chart title, rendered ahead of `titleKey` when set
  // (see custom-dashboards synthesis). Optional so predefined configs are unaffected.
  titleLabel?: string;
  // Computed/formula metric carried alongside the atomic `metric` for
  // custom-dashboard charts; consumed by the rendering pipeline when present.
  computedMetric?: ComputedMetric;
};

export type BarChartConfig = {
  chartType: ChartType.Bar;
  labelDataAsPercent?: boolean;
  // TODO(@yhe-cn, 04/09/2024): might wanna generalize sort and breakdownLimit for all chart type
  sort?: TGenericRAQIV2Sort;
  breakdownLimit?: number;
};

export type MapAndBarChartConfig = Omit<BarChartConfig, 'chartType'> & {
  chartType: ChartType.Map;
  mapLegendSplits?: number[];
};

export type ColumnChartConfig = {
  chartType: ChartType.Column;
  hideTotalSeriesBecauseAllBreakdownsAreUniformlyPositiveOrNegative?: boolean;
  stacking?: boolean;
};

/**
 * Normalized quota line configuration consumed by spline charts. The shape is
 * derived from the metric's `quotaConfig` in the developer-analytics display
 * config (see `TRAQIV2MetricDisplayConfig.quotaConfig`):
 *
 * - `Metric`: `{ metric: <quotaMetric> }` — render the quota line from a
 *   backend metric query (existing behavior).
 * - `Static`: `{ staticValue, color?, label?, hideLegend? }` — render a flat
 *   horizontal line at `value`. No network fetch is performed and no quota
 *   summary is computed.
 *
 * The normalization to this discriminated union happens once in
 * `normalizeCodegenQuotaConfig` (and its `getQuotaConfigForMetric` wrapper) so
 * the rest of the chart pipeline doesn't have to worry about the
 * optional-fields shape coming out of codegen.
 */
export type QuotaConfig =
  | { type: 'Metric'; metric: TRAQIV2NumericUIMetric }
  | {
      type: 'Static';
      value: number;
      color?: ChartColor;
      labelKey?: TranslationKey;
      hideLegend?: boolean;
    };

export type SplineChartConfig = {
  chartType: ChartType.Spline;
  hideTotalSeriesInChart?: boolean;
  /**
   * Render the metric-backed quota line even when the primary metric is
   * broken down. Most breakdown charts intentionally suppress aggregate quota
   * overlays, so this is opt-in for charts where one shared quota applies to
   * every displayed breakdown series.
   */
  showQuotaWithBreakdown?: boolean;
};

export type AreaChartConfig = {
  chartType: ChartType.Area;
};

export type DurationSplineChartConfig = {
  chartType: ChartType.DurationSpline;
  hideTotalSeriesInChart?: boolean;
};

export type DurationAreaChartConfig = {
  chartType: ChartType.DurationArea;
};

export type PieChartConfig = {
  chartType: ChartType.Pie;
  labelDataAsPercent?: boolean;
  tooltipDataAsPercent?: boolean;
};

type MultiMetricConfig = Omit<MetricConfig, 'overrides'> & {
  overrides: Omit<SpecOverride, 'breakdown' | 'granularity'>;
};

export type MultipleMetricSplineChartConfig = Omit<
  ChartConfigBase,
  'summarySpec' | 'metric' | 'overrides'
> & {
  chartType: ChartType.MultipleMetricSpline;
  metricsConfig: NonEmptyArray<MultiMetricConfig>;
  summarySpec?: never;
};

type SingleMetricChartConfig = ChartConfigBase &
  (
    | BarChartConfig
    | ColumnChartConfig
    | SplineChartConfig
    | MapAndBarChartConfig
    | AreaChartConfig
    | DurationSplineChartConfig
    | DurationAreaChartConfig
    | PieChartConfig
  );

export type ChartConfig = MultipleMetricSplineChartConfig | SingleMetricChartConfig;

export const isMultiMetricChartConfig = (
  config: ChartConfig,
): config is MultipleMetricSplineChartConfig => {
  return config.chartType === ChartType.MultipleMetricSpline;
};

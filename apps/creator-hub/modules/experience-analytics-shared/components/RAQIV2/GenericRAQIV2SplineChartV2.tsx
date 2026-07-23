import type { FC } from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import type { LineRange } from '@rbx/analytics-ui';
import {
  ChartStyleMode,
  LineChart,
  SeriesDataTypes,
  type SingleLineSeries,
} from '@rbx/analytics-ui';
import type {
  FormattedText,
  TranslationKey,
  TranslationKeyToFormattedText,
} from '@modules/analytics-translations/types';
import type GenericCsvExporter from '@modules/charts-generic/charts/exporters/GenericCsvExporter';
import TimeSeriesChartExporter from '@modules/charts-generic/charts/exporters/TimeSeriesChartExporter';
import { useXAxisFormatter } from '@modules/charts-generic/charts/formatters/axisFormatters';
import useChartSummarySpecs from '@modules/charts-generic/charts/hooks/useChartSummarySpecs';
import useTimeSeriesChartTooltipFormatters from '@modules/charts-generic/charts/hooks/useTimeSeriesChartTooltipFormatters';
import useTimeSeriesChartYAxisConfig from '@modules/charts-generic/charts/hooks/useTimeSeriesChartYAxisConfig';
import getTypeLegendDescription from '@modules/charts-generic/charts/TimeSeriesRangeAnnotationLegend';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import type {
  GenericTimeSeriesChartSpec,
  TagFormatterFn,
} from '@modules/charts-generic/charts/types/TimeSeriesTypes';
import useLocale from '@modules/charts-generic/context/useLocale';
import { AnnotationType } from '@modules/clients/analytics';
import genericAnalyticsBenchmarksAdapter from '../../adapters/genericAnalyticsBenchmarksAdapter';
import {
  getDefaultSummarySpec,
  summaryRendersComparisonChip,
} from '../../adapters/genericRAQIV2ChartSummaryAdapter';
import genericRAQIV2TimeSeriesSplineChartAdapter from '../../adapters/genericRAQIV2TimeSeriesSplineChartAdapter';
import getAnalyticsMetricDisplayConfig from '../../constants/AnalyticsMetricDisplayConfig';
import { AnnotationConfig, MetricAnnotationType } from '../../constants/annotationConfig';
import { COMPARISON_RELATIVE_OFFSET_TO_MS } from '../../constants/comparisonOffset';
import {
  getNonMetricRelatedConfigFromPredefinedChart,
  getOverlays,
  getDisplayOptions,
} from '../../constants/RAQIV2PredefinedChartConfig';
import useExperienceAnalyticsCurrentXAxisGranularity from '../../context/useExperienceAnalyticsCurrentXAxisGranularity';
import getEmptyArray from '../../emptyArray';
import { RAQIV2SummaryType, type RAQIV2CompoundSummaryType } from '../../enums/RAQIV2SummaryType';
import useAnalyticsBenchmarksHook from '../../hooks/useAnalyticsBenchmarks';
import { useAnalyticsQuota } from '../../hooks/useAnalyticsQuota';
import useBreakdownColors from '../../hooks/useBreakdownColors';
import useChartTimeSeriesAnnotations from '../../hooks/useChartTimeSeriesAnnotations';
import useCurrentAnnotationsBundleProvider from '../../hooks/useCurrentAnnotationsBundleProvider';
import useMetricAwareYAxisFormatterEnabled from '../../hooks/useMetricAwareYAxisFormatterEnabled';
import useRAQIV2Request from '../../hooks/useRAQIV2Request';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import useResolvedOverlays from '../../hooks/useResolvedOverlays';
import useSentryChartTracers from '../../hooks/useSentryChartTracers';
import useTimeAxisSpecFromChartContext from '../../hooks/useTimeAxisSpecFromChartContext';
import useTimeSeriesWebbloxAnnotations from '../../hooks/useTimeSeriesWebbloxAnnotations';
import {
  getAtomicMetricsFromMetricLike,
  getUIMetricFromAtomicMetricLike,
  isComputedMetric,
} from '../../types/ComputedMetric';
import type GenericRAQIV2ChartProps from '../../types/GenericRAQIV2ChartProps';
import type { RAQIV2UIQueryRequest } from '../../types/RAQIV2UIQueryRequest';
import getFetchComparison from '../../utils/getFetchComparison';
import { hasMetricFanoutBreakdown } from '../../utils/isMetricFanoutDimension';
import type { MakeRAQIV2RequestOptions } from '../../utils/makeRAQIV2Request';
import { getMetricLabelFromMetricLike } from '../../utils/metricLikeSemantics';
import resolveComparisonConfig from '../../utils/resolveComparisonConfig';
import useLoadThumbnailAssetIdsForData from '../../utils/thumbnailsUtils';
import getDimensionRenderer from '../getDimensionRenderer';
import genericChartStateToChartAbnormalState from './genericChartStateToChartAbnormalState';
import RAQIV2SingleChartCard from './RAQIV2SingleChartCard';
import useMetricOwnershipWatermarkSlots from './useMetricOwnershipWatermarkSlots';

export type GenericRAQIV2SplineChartV2Props = GenericRAQIV2ChartProps & {
  customExporter?: new (
    metric: FormattedText,
    chart: GenericTimeSeriesChartSpec,
    translate: TranslationKeyToFormattedText,
    fileNamePrefix?: string,
    breakColumnHeaderKeys?: readonly TranslationKey[],
  ) => GenericCsvExporter;
};

const GenericRAQIV2SplineChartV2: FC<GenericRAQIV2SplineChartV2Props> = ({
  spec,
  chartKeyOrConfig,
  comparison,
  titleLabel,
  titleKey,
  definitionTooltipKey,
  footerProps,
  onSelectChartRegion,
  chartWarnings,
  summarySpec,
  ignoreCache,
  chartStyleMode = ChartStyleMode.Normal,
  overlays,
  displayOptions,
  chartControl,
  chartHeight,
  inRoundedComparisonChipContext,
  renderWithoutPeripherals,
  showStartAndEndXAxisTickOnly,
  onChartDataUpdated,
  quotaConfig,
  showQuotaWithBreakdown,
  customExporter,
  chartBanner,
  chartLocation,
}) => {
  const {
    resource: { id: resourceId },
    timeSpec,
    granularity,
    breakdown,
    filter,
    metric,
    limit,
  } = spec;
  const ownershipWatermarkSlots = useMetricOwnershipWatermarkSlots(spec);

  const configOverlays = useMemo(
    () =>
      chartKeyOrConfig
        ? getOverlays(getNonMetricRelatedConfigFromPredefinedChart(chartKeyOrConfig))
        : undefined,
    [chartKeyOrConfig],
  );
  const configDisplayOptions = useMemo(
    () =>
      chartKeyOrConfig
        ? getDisplayOptions(getNonMetricRelatedConfigFromPredefinedChart(chartKeyOrConfig))
        : undefined,
    [chartKeyOrConfig],
  );
  const effectiveOverlays = overlays ?? configOverlays;
  const effectiveDisplayOptions = useMemo(
    () => ({ ...configDisplayOptions, ...displayOptions }),
    [configDisplayOptions, displayOptions],
  );
  const resolvedComparison = useMemo(() => resolveComparisonConfig(comparison), [comparison]);

  const overlayContext = useMemo(() => ({ chartType: ChartType.Spline, breakdown }), [breakdown]);
  const resolvedOverlays = useResolvedOverlays(effectiveOverlays, overlayContext);
  const showComparisonOverlay = resolvedOverlays.comparison;
  const comparisonRelativeOffset = resolvedOverlays.comparisonOffset;
  const comparisonCustomStartDate = resolvedOverlays.comparisonCustomStartDate;
  const showBenchmarks = resolvedOverlays.benchmark.show;
  const benchmarkTypeOverride = resolvedOverlays.benchmark.benchmarkType;
  const hideTotalSeriesInChart = effectiveDisplayOptions?.hideTotalSeriesInChart ?? false;

  const sentryBundle = useSentryChartTracers({
    metric,
    componentKeyOrConfig: chartKeyOrConfig,
    breakdown: breakdown?.slice(),
    numExpectedPoints: 0,
  });

  const locale = useLocale();
  const translationDependencies = useRAQIV2TranslationDependencies();
  const metricLabel = useMemo(
    () => getMetricLabelFromMetricLike(metric, translationDependencies),
    [metric, translationDependencies],
  );
  const xAxisGranularity = useExperienceAnalyticsCurrentXAxisGranularity();

  const { summarySpecOrDefault, quotaSummarySpec } = useMemo(() => {
    const summary = summarySpec ?? getDefaultSummarySpec(spec);
    return {
      summarySpecOrDefault: summary,
      quotaSummarySpec: summary.totalSummaryTypes.filter(
        (s: RAQIV2CompoundSummaryType) => s.type === RAQIV2SummaryType.QuotaPercentageUsage,
      ),
    };
  }, [spec, summarySpec]);

  // Metric-driven quota lines normally retain comparison series for
  // percentage-usage summaries. The explicit quota-with-breakdown mode keeps
  // only current source series so the aggregate quota remains readable.
  const showComparisonInChartOverride =
    showComparisonOverlay || (quotaConfig?.type === 'Metric' && !showQuotaWithBreakdown);

  const showComparisonChip =
    resolvedComparison.chip && summaryRendersComparisonChip(summarySpecOrDefault);
  const fetchComparison = showComparisonChip || showComparisonInChartOverride;

  // Breakdown charts strip comparison fetches by default (see
  // `stripFetchComparisonForBreakdown`). Comparison data has two consumers:
  // the in-chart overlay series (`showComparisonInChartOverride`) and the
  // summary's period-over-period chip. Opt in when either needs it, otherwise
  // breakdown charts with a comparison chip (e.g. acquisition-by-source) lose
  // their chip.
  const allowComparisonWithBreakdown = showComparisonInChartOverride || showComparisonChip;

  const RAQIV2RequestOptions: MakeRAQIV2RequestOptions = useMemo(() => {
    const fillMissingDatapoints = isComputedMetric(metric)
      ? false
      : getAnalyticsMetricDisplayConfig(getUIMetricFromAtomicMetricLike(metric))
          .fillMissingDatapoints;
    return {
      fetchTotalSeries: !hasMetricFanoutBreakdown(breakdown),
      fetchComparison: getFetchComparison(
        fetchComparison,
        granularity,
        resolvedComparison.rangePolicy,
        comparisonRelativeOffset,
        comparisonCustomStartDate,
      ),
      allowComparisonWithBreakdown,
      fillMissingDatapoints,
    };
  }, [
    metric,
    fetchComparison,
    granularity,
    breakdown,
    comparisonRelativeOffset,
    comparisonCustomStartDate,
    allowComparisonWithBreakdown,
    resolvedComparison.rangePolicy,
  ]);

  const queryRequest: RAQIV2UIQueryRequest = useMemo(() => {
    return {
      resource: spec.resource,
      timeSpec,
      granularity,
      filter,
      breakdown,
      metric,
      limit,
    };
  }, [breakdown, filter, granularity, metric, spec.resource, timeSpec, limit]);

  sentryBundle.startDataLoading();
  const {
    data: raqiData,
    isDataLoading,
    isResponseFailed,
    isUserForbidden,
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- TODO(shumingxu, 05/19/2025): Remove in DSA-4491
    isNoDataAvailable,
    error,
  } = useRAQIV2Request(queryRequest, RAQIV2RequestOptions, ignoreCache);

  const requestStatus = useMemo(() => {
    return { isDataLoading, isResponseFailed, isUserForbidden, isNoDataAvailable, error };
  }, [isDataLoading, isResponseFailed, isUserForbidden, isNoDataAvailable, error]);
  sentryBundle.handleRAQIV2RequestResult(requestStatus);

  useLoadThumbnailAssetIdsForData(raqiData);

  const {
    data: rawBenchmarkData,
    hasBenchmarks: rawHasBenchmarks,
    hasSimilarityBenchmarks: rawHasSimilarityBenchmarks,
  } = useAnalyticsBenchmarksHook(spec, benchmarkTypeOverride);
  const benchmarkData = showBenchmarks ? rawBenchmarkData : null;
  const hasBenchmarks = showBenchmarks ? rawHasBenchmarks : false;
  const hasSimilarityBenchmarks = showBenchmarks ? rawHasSimilarityBenchmarks : false;

  /**
   * Overlay data composition pipeline (order matters):
   *
   * 1. useRAQIV2Request — fetch main + comparison time-series data
   * 2. genericRAQIV2TimeSeriesSplineChartAdapter — build chart series; comparison
   *    series are suppressed when benchmarks are active (`!hasBenchmarks`)
   * 3. useAnalyticsQuota — append quota threshold series
   * 4. genericAnalyticsBenchmarksAdapter — append benchmark range/series;
   *    when range benchmarks are present, breakdown series are filtered out
   *    (only total + comparison kept)
   *
   * This ordering is load-bearing: comparison ↔ benchmark mutual exclusion
   * depends on step 2 seeing `hasBenchmarks`, and the series filtering in
   * step 4 assumes all prior series are already composed.
   *
   * Future overlay hooks should compose AFTER benchmarks
   * to respect the same invariants.
   */
  const { chart: chartWithoutBenchmarks, summary: chartSummary } = useMemo(
    () =>
      genericRAQIV2TimeSeriesSplineChartAdapter({
        responses: raqiData ?? { response: null },
        spec,
        translationDependencies,
        granularity,
        summarySpec: summarySpecOrDefault,
        showComparisonInChart: showComparisonInChartOverride && !hasBenchmarks,
        showComparisonChip,
        hideTotalSeriesInChart,
        numberContextMetadata: { chartSpec: spec, inRoundedComparisonChipContext },
        comparisonRelativeOffset,
        comparisonCustomStartDate,
      }),
    [
      comparisonRelativeOffset,
      comparisonCustomStartDate,
      hasBenchmarks,
      hideTotalSeriesInChart,
      inRoundedComparisonChipContext,
      raqiData,
      granularity,
      showComparisonInChartOverride,
      showComparisonChip,
      spec,
      summarySpecOrDefault,
      translationDependencies,
    ],
  );

  const quotaProps = useMemo(
    () => ({
      mainSpec: spec,
      mainChart: chartWithoutBenchmarks,
      quotaConfig,
      summarySpec: quotaSummarySpec,
      fetchComparison: getFetchComparison(
        resolvedComparison.chip && quotaSummarySpec.length > 0,
        granularity,
        resolvedComparison.rangePolicy,
        undefined,
        comparisonCustomStartDate,
      ),
      inRoundedComparisonChipContext,
      ignoreCache,
      showQuotaWithBreakdown,
    }),
    [
      spec,
      chartWithoutBenchmarks,
      quotaConfig,
      quotaSummarySpec,
      resolvedComparison.chip,
      resolvedComparison.rangePolicy,
      granularity,
      comparisonCustomStartDate,
      inRoundedComparisonChipContext,
      ignoreCache,
      showQuotaWithBreakdown,
    ],
  );

  const { chartWithQuota, quotaSummary } = useAnalyticsQuota(quotaProps);

  const summary = useMemo(() => [...chartSummary, ...quotaSummary], [chartSummary, quotaSummary]);

  const { chart, rangeBenchmarkSpec, benchmarkSeriesMetadata } = useMemo(
    () =>
      genericAnalyticsBenchmarksAdapter(
        spec,
        chartWithQuota,
        benchmarkData,
        locale,
        translationDependencies,
      ),
    [benchmarkData, chartWithQuota, locale, spec, translationDependencies],
  );

  const seriesBreakdownValues = useMemo(
    () => chart.series.map((s) => s.breakdownValues ?? []),
    [chart.series],
  );
  const getBreakdownColor = useBreakdownColors(breakdown, seriesBreakdownValues);

  const dataForLineChart: {
    series: Array<SingleLineSeries<number, number>>;
    range?: LineRange<number, number, TagFormatterFn>;
  } = useMemo(() => {
    let { series } = chart;

    // only include total and comparison series if we show range benchmark
    if (rangeBenchmarkSpec?.range) {
      series = series.filter(
        (s) => s.type === SeriesDataTypes.Comparison || s.type === SeriesDataTypes.Total,
      );
    }

    // Strip the status (third element) from data points before passing to chart component
    // The status is internal to charts-generic and used for CSV export
    const seriesForChart = series.map((s) => ({
      ...s,
      dataPoints: s.dataPoints.map(([x, y]) => [x, y] as [number, number | null]),
      color: s.color ?? getBreakdownColor(s.breakdownValues ?? []),
    }));

    return {
      series: seriesForChart,
      range: rangeBenchmarkSpec?.range,
    };
  }, [chart, rangeBenchmarkSpec, getBreakdownColor]);

  const timeAxisSpec = useTimeAxisSpecFromChartContext({
    chartContext: spec,
  });

  const isAnnotationSupported = useCallback(
    (annotationType: AnnotationType): boolean | undefined => {
      if (annotationType === AnnotationType.Benchmark) {
        // Benchmark needs a single canonical metric. For computed metrics
        // `getRAQIV2BenchmarkMetricFromMetricLike` returns null, so a benchmark
        // annotation has no meaningful target — match AreaChart and turn it off.
        if (isComputedMetric(metric)) {
          return false;
        }
        if (!hasSimilarityBenchmarks) {
          return false;
        }
      }
      if (annotationType === AnnotationType.RetentionCorhortDisclaimer) {
        // Hide the disclaimer when the chart's latest data point is already at or past
        // the time-axis end (i.e. we're inside the retention window). For computed
        // metrics, apply the rule if any source metric is configured for it; otherwise
        // fall through to the default `showForUnconfiguredMetrics` filter, which will
        // exclude the disclaimer when no source is configured.
        const perMetricConfig = getAtomicMetricsFromMetricLike(metric)
          .map((m) => AnnotationConfig[annotationType].perMetricConfigs[m])
          .find((cfg) => cfg !== undefined);
        const latestDataTimestampMs = chart.timestamps[chart.timestamps.length - 1];
        const timeAxisEndMs = timeAxisSpec.endDate.getTime();

        if (
          perMetricConfig?.type ===
            MetricAnnotationType.DateRangeWithLatestDataTimestampToTimeAxisEnd &&
          latestDataTimestampMs &&
          latestDataTimestampMs >= timeAxisEndMs
        ) {
          return false;
        }
      }
      return undefined;
    },
    [metric, hasSimilarityBenchmarks, chart.timestamps, timeAxisSpec.endDate],
  );

  const { getCurrentSupportedAnnotations } = useCurrentAnnotationsBundleProvider(
    spec.resource.type,
  );
  const { timeSeriesAnnotations, metricForPerMetricTweaks } = useChartTimeSeriesAnnotations({
    metric,
    getCurrentSupportedAnnotations,
    isSupportedOverride: isAnnotationSupported,
    chartBreakdown: breakdown,
    chartFilter: filter,
  });

  // The chart's comparison-series data points are remapped onto the main
  // series' x-axis (see `ingestRaqiV2ComparisonSeries`), so the tooltip needs
  // an explicit offset to recover the original comparison timestamp. Without
  // this, `getPeriodComparisonSeriesDateOffset` falls back to the legacy
  // "previous-period" math (`duration + interval`), which is meaningless for
  // a fixed relative offset or an anchored custom start date.
  //
  // Anchor against `timeAxisSpec.startDate` (the snapped main start that the
  // chart actually plots) rather than `spec.timeSpec.startTime` — the latter
  // is the raw `subDays(new Date(), n)` value from the date-range provider,
  // which carries the page-load time-of-day and is *not* UTC-midnight. Using
  // the unsnapped value introduces a sub-day delta that flips the UTC-
  // formatted comparison tooltip date by one day in most timezones.
  const comparisonDateOffsetMs =
    comparisonRelativeOffset !== undefined
      ? COMPARISON_RELATIVE_OFFSET_TO_MS[comparisonRelativeOffset]
      : comparisonCustomStartDate !== undefined
        ? timeAxisSpec.startDate.getTime() - comparisonCustomStartDate.getTime()
        : undefined;

  const { tooltipFormatters, formatXForAnnotationTooltip: givenFormatXForAnnotationTooltip } =
    useTimeSeriesChartTooltipFormatters({
      chartUnitSpec: chart.unit,
      granularity,
      rangeBenchmarkSpec,
      series: dataForLineChart.series,
      timeAxisSpec,
      seriesMetadata: benchmarkSeriesMetadata,
      comparisonDateOffsetMs,
    });

  const xAxisFormatter = useXAxisFormatter(locale, granularity, xAxisGranularity, chartStyleMode);

  const xAxisType = useMemo(
    () =>
      ({
        type: 'datetime',
        granularity: xAxisGranularity,
      }) as const,
    [xAxisGranularity],
  );

  const xAxisTickPosition = useMemo(() => {
    return showStartAndEndXAxisTickOnly
      ? [timeSpec.startTime.getTime(), timeSpec.endTime.getTime()]
      : undefined;
  }, [showStartAndEndXAxisTickOnly, timeSpec.endTime, timeSpec.startTime]);

  const zoneLegendItemFormatter = useCallback(
    (type: SeriesDataTypes) =>
      getTypeLegendDescription(type, translationDependencies.translate) ?? '',
    [translationDependencies.translate],
  );

  const annotations = useTimeSeriesWebbloxAnnotations({
    timeSeriesAnnotations: timeSeriesAnnotations ?? getEmptyArray(),
    metric: metricForPerMetricTweaks,
    timeAxisSpec,
    latestDataTimestamp: new Date(chart.timestamps[chart.timestamps.length - 1]),
  });

  const enableMetricAwareYAxisFormatter = useMetricAwareYAxisFormatterEnabled();
  const yAxisConfig = useTimeSeriesChartYAxisConfig({
    unitSpec: chart.unit,
    translationDependencies,
    enableMetricAwareYAxisFormatter,
  });
  const yAxisConfigs = useMemo(() => [yAxisConfig], [yAxisConfig]);

  const xAxisBounds: [number, number] | undefined = useMemo(
    () =>
      spec.timeAxisBounds !== 'disabled'
        ? [timeAxisSpec.startDate.getTime(), timeAxisSpec.endDate.getTime()]
        : undefined,
    [spec.timeAxisBounds, timeAxisSpec.endDate, timeAxisSpec.startDate],
  );

  const formatXForAnnotationTooltip = useCallback(
    (x: number | string, annotationId: string) => {
      // The empty-tooltip override only fires for `DateRangeShifted` annotations,
      // which are anchored to a single canonical metric. For computed metrics we
      // fall through to the default x-axis formatter rather than picking a source.
      if (!metricForPerMetricTweaks) {
        return givenFormatXForAnnotationTooltip(x);
      }
      const annotation = timeSeriesAnnotations?.find((a) => a.id === annotationId);
      if (!annotation) {
        return givenFormatXForAnnotationTooltip(x);
      }

      const { perMetricConfigs } = AnnotationConfig[annotation.type];
      const perMetricConfig = perMetricConfigs[metricForPerMetricTweaks];

      // don't show xAxis tooltip
      return perMetricConfig?.type === MetricAnnotationType.DateRangeShifted
        ? ''
        : givenFormatXForAnnotationTooltip(x);
    },
    [metricForPerMetricTweaks, givenFormatXForAnnotationTooltip, timeSeriesAnnotations],
  );

  const chartComponent = useMemo(
    () => (
      <LineChart
        data={dataForLineChart}
        chartStyleMode={chartStyleMode}
        xAxisFormatter={xAxisFormatter}
        xAxisType={xAxisType}
        xAxisTickPositions={xAxisTickPosition}
        yAxisConfigs={yAxisConfigs}
        onSelectChartRegion={onSelectChartRegion ?? undefined}
        annotations={annotations}
        zoneLegendItemFormatter={zoneLegendItemFormatter}
        height={chartHeight}
        tooltipFormatters={tooltipFormatters}
        xAxisBounds={xAxisBounds}
        formatXForAnnotationTooltip={formatXForAnnotationTooltip}
      />
    ),
    [
      xAxisType,
      dataForLineChart,
      chartStyleMode,
      xAxisFormatter,
      xAxisTickPosition,
      yAxisConfigs,
      onSelectChartRegion,
      annotations,
      zoneLegendItemFormatter,
      chartHeight,
      tooltipFormatters,
      xAxisBounds,
      formatXForAnnotationTooltip,
    ],
  );

  const exporter = useMemo(() => {
    // Falsy-fallback chain (preserve existing semantics: empty `titleLabel`
    // and empty translation results both fall through to the resource-id
    // default). The explicit `?? ''` coercions narrow the nullable LHS to
    // `string` so the otherwise-equivalent `||` chain doesn't trip
    // typescript-eslint(prefer-nullish-coalescing).
    const fileNamePrefix =
      titleLabel ??
      (titleKey ? translationDependencies.translate(titleKey) : undefined) ??
      `${spec.resource.type}-${resourceId}`;

    // Pre-resolve one translation key per breakdown dimension so the
    // CSV exporter can render a compound header
    // (e.g. `"Age Group, Operating System"`) that mirrors the
    // comma-joined value cells produced by `getBreakdownName`. Empty
    // breakdown falls through to the exporter's default "Breakdown"
    // header. Built here (not in the adapter) so the chart-render type
    // stays free of export-only metadata.
    const breakColumnHeaderKeys = (breakdown ?? []).map((d) => getDimensionRenderer(d).name);

    const exporterArgs: ConstructorParameters<typeof TimeSeriesChartExporter> = [
      metricLabel,
      chart,
      translationDependencies.translate,
      fileNamePrefix,
      breakColumnHeaderKeys,
    ];

    if (!customExporter) {
      return new TimeSeriesChartExporter(...exporterArgs);
    }
    const CustomExporter = customExporter;
    return new CustomExporter(...exporterArgs);
  }, [
    breakdown,
    chart,
    metricLabel,
    resourceId,
    spec.resource.type,
    titleLabel,
    titleKey,
    translationDependencies,
    customExporter,
  ]);

  const charSummarySpecs = useChartSummarySpecs(summary);
  const abnormalState = useMemo(
    () =>
      genericChartStateToChartAbnormalState({
        state: requestStatus,
        hasNoData: exporter.hasEmptyData,
        translate: translationDependencies.translate,
        tPendingTranslation: translationDependencies.tPendingTranslation,
      }),
    [
      exporter.hasEmptyData,
      requestStatus,
      translationDependencies.translate,
      translationDependencies.tPendingTranslation,
    ],
  );

  useEffect(() => {
    onChartDataUpdated?.({
      chartState: requestStatus,
      summaryItems: summary,
      exporter,
    });
  }, [exporter, onChartDataUpdated, requestStatus, summary]);

  return renderWithoutPeripherals ? (
    chartComponent
  ) : (
    <RAQIV2SingleChartCard
      // oxlint-disable-next-line typescript/prefer-nullish-coalescing -- Empty titleLabel should fall back to the translated title.
      titleLabel={titleLabel || (titleKey ? translationDependencies.translate(titleKey) : '')}
      titleTooltipLabel={
        definitionTooltipKey ? translationDependencies.translate(definitionTooltipKey) : undefined
      }
      chartSummarySpecs={charSummarySpecs}
      chartKeyOrConfig={chartKeyOrConfig}
      spec={spec}
      kpiType={metricLabel}
      exporter={exporter}
      chartLocation={chartLocation}
      visibleTimeSeriesAnnotations={timeSeriesAnnotations}
      chartControl={chartControl}
      chartBanner={chartBanner}
      chartWarnings={chartWarnings}
      footerProps={footerProps}
      abnormalState={abnormalState}
      slots={ownershipWatermarkSlots}>
      {chartComponent}
    </RAQIV2SingleChartCard>
  );
};

export default GenericRAQIV2SplineChartV2;

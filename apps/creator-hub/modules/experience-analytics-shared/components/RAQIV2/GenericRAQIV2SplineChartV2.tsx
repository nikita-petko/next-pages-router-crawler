import { FC, useCallback, useEffect, useMemo } from 'react';

import {
  ChartFooter,
  DailyTimeSeriesAlignedToUTCMidnight,
  GenericCsvExporter,
  GenericTimeSeriesChartSpec,
  getTypeLegendDescription,
  TagFormatterFn,
  TimeSeriesChartExporter,
  useChartSummarySpecs,
  useDownloadAction,
  useLocale,
  useTimeSeriesChartTooltipFormatters,
  useTimeSeriesChartYAxisConfig,
  useXAxisFormatter,
} from '@modules/charts-generic';
import { RAQIV2UIPseudoDimension, TRAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import {
  ChartStyleMode,
  LineChart,
  LineRange,
  SeriesDataTypes,
  SingleChartCardContainer,
  type SingleLineSeries,
} from '@rbx/analytics-ui';
import { AnnotationType } from '@modules/clients/analytics';
import { FormattedText, TranslationKeyToFormattedText } from '@modules/analytics-translations';
import { AnnotationConfig, MetricAnnotationType } from '../../constants/annotationConfig';
import useTimeAxisSpecFromChartContext from '../../hooks/useTimeAxisSpecFromChartContext';
import { RAQIV2UIQueryRequest } from '../../types/RAQIV2UIQueryRequest';
import useExploreModeAction from '../../exploreMode/useExploreModeAction';
import getEmptyArray from '../../emptyArray';
import useSentryChartTracers from '../../hooks/useSentryChartTracers';
import GenericRAQIV2ChartProps from '../../types/GenericRAQIV2ChartProps';
import { getDefaultSummarySpec } from '../../adapters/genericRAQIV2ChartSummaryAdapter';
import { MakeRAQIV2RequestOptions } from '../../utils/makeRAQIV2Request';
import useRAQIV2Request from '../../hooks/useRAQIV2Request';
import getFetchComparison from '../../utils/getFetchComparison';
import RAQIV2MetricGranularityToSeriesIntervalMeaning from '../../constants/RAQIV2MetricGranularityToSeriesIntervalMeaning';
import genericRAQIV2TimeSeriesSplineChartAdapter from '../../adapters/genericRAQIV2TimeSeriesSplineChartAdapter';
import { useLoadThumbnailAssetIdsForData } from '../../utils/thumbnailsUtils';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import useExperienceAnalyticsCurrentXAxisGranularity from '../../context/useExperienceAnalyticsCurrentXAxisGranularity';
import useCurrentAnnotationsBundleProvider from '../../hooks/useCurrentAnnotationsBundleProvider';
import useAnalyticsBenchmarks from '../../hooks/useAnalyticsBenchmarks';
import useTimeSeriesWebbloxAnnotations from '../../hooks/useTimeSeriesWebbloxAnnotations';
import genericChartStateToChartAbnormalState from './genericChartStateToChartAbnormalState';
import genericAnalyticsBenchmarksAdapter from '../../adapters/genericAnalyticsBenchmarksAdapter';
import { useAnalyticsQuota } from '../../hooks/useAnalyticsQuota';
import RAQIV2SummaryType, { RAQIV2CompoundSummaryType } from '../../enums/RAQIV2SummaryType';
import getAnalyticsMetricDisplayConfig from '../../constants/AnalyticsMetricDisplayConfig';
import { isComputedMetric } from '../../types/ComputedMetric';
import {
  getExportLabelFromMetricLike,
  getMetricLabelFromMetricLike,
} from '../../utils/metricLikeSemantics';
import useBreakdownColors from '../../hooks/useBreakdownColors';
import {
  getNonMetricRelatedConfigFromPredefinedChart,
  getOverlays,
  getDisplayOptions,
} from '../../constants/RAQIV2PredefinedChartConfig';
import useResolvedOverlays from '../../hooks/useResolvedOverlays';

export type GenericRAQIV2SplineChartV2Props = GenericRAQIV2ChartProps & {
  customExporter?: new (
    metric: TRAQIV2UIMetric | FormattedText,
    chart: GenericTimeSeriesChartSpec,
    translate: TranslationKeyToFormattedText,
    fileNamePrefix?: string,
  ) => GenericCsvExporter;
};

const GenericRAQIV2SplineChartV2: FC<GenericRAQIV2SplineChartV2Props> = ({
  spec,
  chartKeyOrConfig,
  hideComparisonChip,
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
  quotaMetric,
  customExporter,
  chartBanner,
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
  const atomicMetric = useMemo(() => (isComputedMetric(metric) ? null : metric), [metric]);
  const metricLabel = useMemo(() => getMetricLabelFromMetricLike(metric), [metric]);
  const exportMetric = useMemo(() => getExportLabelFromMetricLike(metric), [metric]);

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

  const overlayDefaults = useMemo(() => ({ comparison: !breakdown?.length }), [breakdown?.length]);
  const resolvedOverlays = useResolvedOverlays(effectiveOverlays, overlayDefaults);
  const showComparisonOverlay = resolvedOverlays.comparison;
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
  const seriesIntervalMeaning = granularity
    ? RAQIV2MetricGranularityToSeriesIntervalMeaning(granularity)
    : DailyTimeSeriesAlignedToUTCMidnight;
  const xAxisGranularity = useExperienceAnalyticsCurrentXAxisGranularity();
  const { getCurrentSupportedAnnotations } = useCurrentAnnotationsBundleProvider(
    spec.resource.type,
  );

  const { summarySpecOrDefault, quotaSummarySpec } = useMemo(() => {
    const summary = summarySpec ?? getDefaultSummarySpec(spec);
    return {
      summarySpecOrDefault: summary,
      quotaSummarySpec: summary.totalSummaryTypes.filter(
        (s: RAQIV2CompoundSummaryType) => s.type === RAQIV2SummaryType.QuotaPercentageUsage,
      ),
    };
  }, [spec, summarySpec]);

  const showComparisonInChartOverride = useMemo(() => {
    return showComparisonOverlay || !!quotaMetric;
  }, [showComparisonOverlay, quotaMetric]);

  const fetchComparison = useMemo(() => {
    return !hideComparisonChip || showComparisonInChartOverride;
  }, [hideComparisonChip, showComparisonInChartOverride]);

  const RAQIV2RequestOptions: MakeRAQIV2RequestOptions = useMemo(() => {
    const fillMissingDatapoints = isComputedMetric(metric)
      ? false
      : getAnalyticsMetricDisplayConfig(metric).fillMissingDatapoints;
    return {
      // Total series across a percentile breakdown makes no sense,
      // so we don't fetch a "total" in this case
      fetchTotalSeries: !breakdown?.includes(RAQIV2UIPseudoDimension.PercentileType),
      fetchComparison: getFetchComparison(fetchComparison, seriesIntervalMeaning),
      fillMissingDatapoints,
    };
  }, [metric, fetchComparison, seriesIntervalMeaning, breakdown]);

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
    // eslint-disable-next-line deprecation/deprecation -- TODO(shumingxu, 05/19/2025): Remove in DSA-4491
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
  } = useAnalyticsBenchmarks(spec, benchmarkTypeOverride);
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
   * Future overlay hooks (e.g. trend-line) should compose AFTER benchmarks
   * to respect the same invariants.
   */
  const { chart: chartWithoutBenchmarks, summary: chartSummary } = useMemo(
    () =>
      genericRAQIV2TimeSeriesSplineChartAdapter({
        responses: raqiData ?? { response: null },
        spec,
        translationDependencies,
        seriesIntervalMeaning,
        summarySpec: summarySpecOrDefault,
        showComparisonInChart: showComparisonInChartOverride && !hasBenchmarks,
        hideTotalSeriesInChart,
        numberContextMetadata: { chartSpec: spec, inRoundedComparisonChipContext },
      }),
    [
      hasBenchmarks,
      hideTotalSeriesInChart,
      inRoundedComparisonChipContext,
      raqiData,
      seriesIntervalMeaning,
      showComparisonInChartOverride,
      spec,
      summarySpecOrDefault,
      translationDependencies,
    ],
  );

  const quotaProps = useMemo(
    () => ({
      mainSpec: spec,
      mainChart: chartWithoutBenchmarks,
      quotaMetric,
      summarySpec: quotaSummarySpec,
      fetchComparison: getFetchComparison(
        !hideComparisonChip && quotaSummarySpec.length >= 0,
        seriesIntervalMeaning,
      ),
      inRoundedComparisonChipContext,
      ignoreCache,
    }),
    [
      spec,
      chartWithoutBenchmarks,
      quotaMetric,
      quotaSummarySpec,
      hideComparisonChip,
      seriesIntervalMeaning,
      inRoundedComparisonChipContext,
      ignoreCache,
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

  const timeSeriesAnnotations = useMemo(() => {
    if (!atomicMetric) {
      return [];
    }
    return getCurrentSupportedAnnotations([atomicMetric], (annotationType) => {
      if (annotationType === AnnotationType.Benchmark && !hasSimilarityBenchmarks) {
        return false;
      }
      if (annotationType === AnnotationType.RetentionCorhortDisclaimer) {
        const perMetricConfig = AnnotationConfig[annotationType].perMetricConfigs[atomicMetric];
        const latestDataTimestamp = chart.timestamps[chart.timestamps.length - 1];

        if (
          perMetricConfig?.type ===
            MetricAnnotationType.DateRangeWithLatestDataTimestampToTimeAxisEnd &&
          latestDataTimestamp &&
          latestDataTimestamp >= timeAxisSpec.endDate.getTime()
        ) {
          return false;
        }
      }
      return undefined;
    });
  }, [
    atomicMetric,
    getCurrentSupportedAnnotations,
    hasSimilarityBenchmarks,
    chart.timestamps,
    timeAxisSpec.endDate,
  ]);

  const { tooltipFormatters, formatXForAnnotationTooltip: givenFormatXForAnnotationTooltip } =
    useTimeSeriesChartTooltipFormatters({
      chartUnitSpec: chart.unit,
      seriesIntervalMeaning,
      rangeBenchmarkSpec,
      series: dataForLineChart.series,
      timeAxisSpec,
      seriesMetadata: benchmarkSeriesMetadata,
    });

  const xAxisFormatter = useXAxisFormatter(
    locale,
    seriesIntervalMeaning,
    xAxisGranularity,
    chartStyleMode,
  );

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
    metric: atomicMetric ?? undefined,
    timeAxisSpec,
    latestDataTimestamp: new Date(chart.timestamps[chart.timestamps.length - 1]),
  });

  const yAxisConfig = useTimeSeriesChartYAxisConfig({
    unitSpec: chart.unit,
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
      if (!atomicMetric) {
        return givenFormatXForAnnotationTooltip(x);
      }
      const annotation = timeSeriesAnnotations?.find((a) => a.id === annotationId);
      if (!annotation) {
        return givenFormatXForAnnotationTooltip(x);
      }

      const { perMetricConfigs } = AnnotationConfig[annotation.type];
      const perMetricConfig = perMetricConfigs[atomicMetric];

      // don't show xAxis tooltip
      return perMetricConfig?.type === MetricAnnotationType.DateRangeShifted
        ? ''
        : givenFormatXForAnnotationTooltip(x);
    },
    [atomicMetric, givenFormatXForAnnotationTooltip, timeSeriesAnnotations],
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
    const fileNamePrefix =
      titleLabel ||
      (titleKey ? translationDependencies.translate(titleKey) : undefined) ||
      `${spec.resource.type}-${resourceId}`;

    const exporterArgs: ConstructorParameters<typeof TimeSeriesChartExporter> = [
      exportMetric,
      chart,
      translationDependencies.translate,
      fileNamePrefix,
    ];

    if (!customExporter) {
      return new TimeSeriesChartExporter(...exporterArgs);
    }
    const CustomExporter = customExporter;
    return new CustomExporter(...exporterArgs);
  }, [
    chart,
    exportMetric,
    resourceId,
    spec.resource.type,
    titleLabel,
    titleKey,
    translationDependencies,
    customExporter,
  ]);

  const downloadAction = useDownloadAction({
    kpiType: metricLabel,
    exporter,
  });

  const secondaryAction = useExploreModeAction(chartKeyOrConfig, spec);

  const charSummarySpecs = useChartSummarySpecs(summary);
  const abnormalState = useMemo(
    () =>
      genericChartStateToChartAbnormalState({
        state: requestStatus,
        hasNoData: exporter.hasEmptyData,
        translate: translationDependencies.translate,
      }),
    [exporter.hasEmptyData, requestStatus, translationDependencies.translate],
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
    <SingleChartCardContainer
      titleLabel={titleLabel || (titleKey ? translationDependencies.translate(titleKey) : '')}
      titleTooltipLabel={
        definitionTooltipKey ? translationDependencies.translate(definitionTooltipKey) : undefined
      }
      chartSummarySpecs={charSummarySpecs}
      downloadAction={downloadAction}
      secondaryAction={secondaryAction}
      chartControl={chartControl}
      chartBanner={chartBanner}
      footerContent={
        chartWarnings?.length || footerProps?.actionLink ? (
          <ChartFooter warnings={chartWarnings ?? []} {...footerProps} />
        ) : undefined
      }
      abnormalState={abnormalState}>
      {chartComponent}
    </SingleChartCardContainer>
  );
};

export default GenericRAQIV2SplineChartV2;

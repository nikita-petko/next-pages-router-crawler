import React, { FC, useCallback, useEffect, useMemo } from 'react';
import {
  ChartFooter,
  DailyTimeSeriesAlignedToUTCMidnight,
  SplineChartTimeSeriesNamedData,
  TimeSeriesChartExporter,
  useChartSummarySpecs,
  useDownloadAction,
  useLocale,
  useTimeSeriesChartTooltipFormatters,
  useTimeSeriesChartYAxisConfig,
  useXAxisFormatter,
} from '@modules/charts-generic';
import {
  AreaChart,
  ChartColor,
  ChartStyleMode,
  SingleAreaSeries,
  SingleChartCardContainer,
  AreaSeriesDataTypes,
  SeriesDataTypes,
} from '@rbx/analytics-ui';
import { RAQIV2UIPseudoDimension } from '@rbx/creator-hub-analytics-config';
import { AnnotationType } from '@modules/clients/analytics';
import { isValidArrayEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';
import useTimeAxisSpecFromChartContext from '../../hooks/useTimeAxisSpecFromChartContext';
import useTimeSeriesWebbloxAnnotations from '../../hooks/useTimeSeriesWebbloxAnnotations';
import useSentryChartTracers from '../../hooks/useSentryChartTracers';
import useExploreModeAction from '../../exploreMode/useExploreModeAction';
import getEmptyArray from '../../emptyArray';
import genericRAQIV2TimeSeriesSplineChartAdapter from '../../adapters/genericRAQIV2TimeSeriesSplineChartAdapter';
import GenericRAQIV2ChartProps from '../../types/GenericRAQIV2ChartProps';
import { getDefaultSummarySpec } from '../../adapters/genericRAQIV2ChartSummaryAdapter';
import { MakeRAQIV2RequestOptions } from '../../utils/makeRAQIV2Request';
import useRAQIV2Request from '../../hooks/useRAQIV2Request';
import { type TRAQIV2NumericUIMetric } from '../../constants/AnalyticsMetricDisplayConfig';
import getFetchComparison from '../../utils/getFetchComparison';
import RAQIV2MetricGranularityToSeriesIntervalMeaning from '../../constants/RAQIV2MetricGranularityToSeriesIntervalMeaning';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import useExperienceAnalyticsCurrentXAxisGranularity from '../../context/useExperienceAnalyticsCurrentXAxisGranularity';
import useCurrentAnnotationsBundleProvider from '../../hooks/useCurrentAnnotationsBundleProvider';
import genericChartStateToChartAbnormalState from './genericChartStateToChartAbnormalState';
import { getAtomicMetricsFromMetricLike } from '../../types/ComputedMetric';
import {
  getExportLabelFromMetricLike,
  getMetricLabelFromMetricLike,
} from '../../utils/metricLikeSemantics';
import useBreakdownColors from '../../hooks/useBreakdownColors';

const GenericRAQIV2AreaChartV2: FC<GenericRAQIV2ChartProps> = ({
  spec,
  chartKeyOrConfig,
  hideComparisonChip,
  titleKey,
  definitionTooltipKey,
  footerProps,
  onSelectChartRegion,
  chartWarnings,
  summarySpec,
  ignoreCache,
  chartStyleMode = ChartStyleMode.Normal,
  chartControl,
  chartHeight,
  inRoundedComparisonChipContext,
  renderWithoutPeripherals,
  onChartDataUpdated,
  chartBanner,
}) => {
  const {
    resource: { id: resourceId, type: resourceType },
    granularity,
    breakdown,
    metric,
  } = spec;

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

  const summarySpecOrDefault = useMemo(
    () => summarySpec ?? getDefaultSummarySpec(spec),
    [spec, summarySpec],
  );

  const RAQIV2RequestOptions: MakeRAQIV2RequestOptions = useMemo(
    () => ({
      // Total series across a percentile breakdown makes no sense,
      // so we don't fetch a "total" in this case
      fetchTotalSeries: !breakdown?.includes(RAQIV2UIPseudoDimension.PercentileType),
      fetchComparison: getFetchComparison(!hideComparisonChip, seriesIntervalMeaning),
    }),
    [seriesIntervalMeaning, hideComparisonChip, breakdown],
  );

  sentryBundle.startDataLoading();
  const {
    data: raqiData,
    isDataLoading,
    isResponseFailed,
    isUserForbidden,
    // eslint-disable-next-line deprecation/deprecation -- Remove in DSA-4491
    isNoDataAvailable,
    error,
  } = useRAQIV2Request(spec, RAQIV2RequestOptions, ignoreCache);
  const requestStatus = useMemo(
    () => ({
      isDataLoading,
      isResponseFailed,
      isUserForbidden,
      isNoDataAvailable,
      error,
    }),
    [isDataLoading, isResponseFailed, isUserForbidden, isNoDataAvailable, error],
  );
  sentryBundle.handleRAQIV2RequestResult(requestStatus);

  const { chart, summary } = useMemo(
    () =>
      genericRAQIV2TimeSeriesSplineChartAdapter({
        responses: raqiData ?? { response: null },
        spec,
        translationDependencies,
        seriesIntervalMeaning,
        summarySpec: summarySpecOrDefault,
        numberContextMetadata: { chartSpec: spec, inRoundedComparisonChipContext },
      }),
    [
      inRoundedComparisonChipContext,
      raqiData,
      seriesIntervalMeaning,
      spec,
      summarySpecOrDefault,
      translationDependencies,
    ],
  );

  const exporter = useMemo(() => {
    return new TimeSeriesChartExporter(
      getExportLabelFromMetricLike(metric),
      chart,
      translationDependencies.translate,
      titleKey ? translationDependencies.translate(titleKey) : `${resourceType}-${resourceId}`,
    );
  }, [chart, metric, resourceId, resourceType, titleKey, translationDependencies]);

  const xAxisFormatter = useXAxisFormatter(
    locale,
    seriesIntervalMeaning,
    xAxisGranularity,
    chartStyleMode,
  );

  const seriesBreakdownValues = useMemo(
    () => chart.series.map((s) => s.breakdownValues ?? []),
    [chart.series],
  );
  const getBreakdownColor = useBreakdownColors(breakdown, seriesBreakdownValues);

  const formatDataForAreaChart = useCallback(
    ({ name, dataPoints, type, custom }: SplineChartTimeSeriesNamedData, color?: ChartColor) => {
      if (!isValidArrayEnumValue(AreaSeriesDataTypes, type)) {
        throw new Error(
          `Unsupported area series data type found in chart ${chartKeyOrConfig}: ${type}`,
        );
      }

      return {
        name,
        dataPoints,
        type,
        custom,
        color,
      };
    },
    [chartKeyOrConfig],
  );

  const dataForAreaChart = useMemo(() => {
    const unsupportedSeriesDataTypes = chart.series.filter(
      (s) => !isValidArrayEnumValue(AreaSeriesDataTypes, s.type),
    );
    if (unsupportedSeriesDataTypes.length > 0) {
      throw new Error(
        `Unsupported area series data type found in chart ${chartKeyOrConfig}: ${unsupportedSeriesDataTypes.map((s) => s.type).join(', ')}`,
      );
    }

    if (chart.series.length === 1 && chart.series[0].type === SeriesDataTypes.Total) {
      return {
        series: [formatDataForAreaChart(chart.series[0])],
      };
    }
    const series: Array<SingleAreaSeries<number, number>> = [];
    chart.series.forEach((s) => {
      if (s.type !== SeriesDataTypes.Total) {
        series.push(
          formatDataForAreaChart(s, s.color ?? getBreakdownColor(s.breakdownValues ?? [])),
        );
      }
    });
    return {
      series,
    };
  }, [chart.series, chartKeyOrConfig, formatDataForAreaChart, getBreakdownColor]);

  const timeAxisSpec = useTimeAxisSpecFromChartContext({
    chartContext: spec,
  });

  const tooltipFormatters = useTimeSeriesChartTooltipFormatters({
    chartUnitSpec: chart.unit,
    seriesIntervalMeaning,
    series: dataForAreaChart.series,
    timeAxisSpec,
  });
  const yAxisConfig = useTimeSeriesChartYAxisConfig({
    unitSpec: chart.unit,
  });

  const timeSeriesAnnotations = useMemo(() => {
    const atomicMetricResult = getAtomicMetricsFromMetricLike(metric);
    if (atomicMetricResult.length === 0) {
      return null;
    }
    const atomicMetrics: [TRAQIV2NumericUIMetric, ...TRAQIV2NumericUIMetric[]] =
      atomicMetricResult as [TRAQIV2NumericUIMetric, ...TRAQIV2NumericUIMetric[]];
    return getCurrentSupportedAnnotations(atomicMetrics, (annotationType) =>
      annotationType === AnnotationType.Benchmark ? false : undefined,
    );
  }, [getCurrentSupportedAnnotations, metric]);

  const annotations = useTimeSeriesWebbloxAnnotations({
    timeSeriesAnnotations: timeSeriesAnnotations ?? getEmptyArray(),
    timeAxisSpec,
  });

  const xAxisType = useMemo(
    () =>
      ({
        type: 'datetime',
        granularity: xAxisGranularity,
      }) as const,
    [xAxisGranularity],
  );

  const xAxisBounds: [number, number] | undefined = useMemo(
    () =>
      spec.timeAxisBounds !== 'disabled'
        ? [timeAxisSpec.startDate.getTime(), timeAxisSpec.endDate.getTime()]
        : undefined,
    [spec.timeAxisBounds, timeAxisSpec.endDate, timeAxisSpec.startDate],
  );

  const chartComponent = useMemo(
    () => (
      <AreaChart
        data={dataForAreaChart}
        chartStyleMode={chartStyleMode}
        xAxisFormatter={xAxisFormatter}
        xAxisType={xAxisType}
        yAxisConfig={yAxisConfig}
        onSelectChartRegion={onSelectChartRegion ?? undefined}
        annotations={annotations}
        height={chartHeight}
        xAxisBounds={xAxisBounds}
        {...tooltipFormatters}
      />
    ),
    [
      dataForAreaChart,
      chartStyleMode,
      xAxisFormatter,
      xAxisType,
      yAxisConfig,
      onSelectChartRegion,
      annotations,
      chartHeight,
      xAxisBounds,
      tooltipFormatters,
    ],
  );

  const downloadAction = useDownloadAction({
    kpiType: getMetricLabelFromMetricLike(metric),
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
  }, [onChartDataUpdated, requestStatus, summary, exporter]);

  return renderWithoutPeripherals ? (
    chartComponent
  ) : (
    <SingleChartCardContainer
      titleLabel={titleKey ? translationDependencies.translate(titleKey) : ''}
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

export default GenericRAQIV2AreaChartV2;

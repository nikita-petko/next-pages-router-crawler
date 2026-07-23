import type { FC } from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import type { ChartColor, SingleAreaSeries } from '@rbx/analytics-ui';
import { AreaChart, ChartStyleMode, AreaSeriesDataTypes, SeriesDataTypes } from '@rbx/analytics-ui';
import TimeSeriesChartExporter from '@modules/charts-generic/charts/exporters/TimeSeriesChartExporter';
import { useXAxisFormatter } from '@modules/charts-generic/charts/formatters/axisFormatters';
import useChartSummarySpecs from '@modules/charts-generic/charts/hooks/useChartSummarySpecs';
import useTimeSeriesChartTooltipFormatters from '@modules/charts-generic/charts/hooks/useTimeSeriesChartTooltipFormatters';
import useTimeSeriesChartYAxisConfig from '@modules/charts-generic/charts/hooks/useTimeSeriesChartYAxisConfig';
import type { SplineChartTimeSeriesNamedData } from '@modules/charts-generic/charts/types/TimeSeriesSplineChartTypes';
import useLocale from '@modules/charts-generic/context/useLocale';
import { AnnotationType } from '@modules/clients/analytics';
import { isValidArrayEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import {
  getDefaultSummarySpec,
  summaryRendersComparisonChip,
} from '../../adapters/genericRAQIV2ChartSummaryAdapter';
import genericRAQIV2TimeSeriesSplineChartAdapter from '../../adapters/genericRAQIV2TimeSeriesSplineChartAdapter';
import type { ChartConfigOrPredefinedKey } from '../../constants/RAQIV2PredefinedChartConfig';
import useExperienceAnalyticsCurrentXAxisGranularity from '../../context/useExperienceAnalyticsCurrentXAxisGranularity';
import getEmptyArray from '../../emptyArray';
import useBreakdownColors from '../../hooks/useBreakdownColors';
import useChartTimeSeriesAnnotations from '../../hooks/useChartTimeSeriesAnnotations';
import useCurrentAnnotationsBundleProvider from '../../hooks/useCurrentAnnotationsBundleProvider';
import useMetricAwareYAxisFormatterEnabled from '../../hooks/useMetricAwareYAxisFormatterEnabled';
import useRAQIV2Request from '../../hooks/useRAQIV2Request';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import useSentryChartTracers from '../../hooks/useSentryChartTracers';
import useTimeAxisSpecFromChartContext from '../../hooks/useTimeAxisSpecFromChartContext';
import useTimeSeriesWebbloxAnnotations from '../../hooks/useTimeSeriesWebbloxAnnotations';
import type GenericRAQIV2ChartProps from '../../types/GenericRAQIV2ChartProps';
import getFetchComparison from '../../utils/getFetchComparison';
import { hasMetricFanoutBreakdown } from '../../utils/isMetricFanoutDimension';
import type { MakeRAQIV2RequestOptions } from '../../utils/makeRAQIV2Request';
import { getMetricLabelFromMetricLike } from '../../utils/metricLikeSemantics';
import resolveComparisonConfig from '../../utils/resolveComparisonConfig';
import getDimensionRenderer from '../getDimensionRenderer';
import genericChartStateToChartAbnormalState from './genericChartStateToChartAbnormalState';
import RAQIV2SingleChartCard from './RAQIV2SingleChartCard';
import useMetricOwnershipWatermarkSlots from './useMetricOwnershipWatermarkSlots';

// Stable reference: AreaChart suppresses Benchmark unconditionally and falls through
// for everything else. Hoisted out of the component so the hook's annotation memo
// keeps a stable identity across re-renders.
const isAnnotationSupported = (annotationType: AnnotationType): boolean | undefined =>
  annotationType === AnnotationType.Benchmark ? false : undefined;

const chartKeyOrConfigForErrorMessage = (
  keyOrConfig: ChartConfigOrPredefinedKey | null,
): string => {
  if (keyOrConfig === null) {
    return 'null';
  }
  if (typeof keyOrConfig === 'string') {
    return keyOrConfig;
  }
  return JSON.stringify(keyOrConfig);
};

const GenericRAQIV2AreaChartV2: FC<GenericRAQIV2ChartProps> = ({
  spec,
  chartKeyOrConfig,
  comparison,
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
  chartLocation,
}) => {
  const {
    resource: { id: resourceId, type: resourceType },
    granularity,
    breakdown,
    filter,
    metric,
  } = spec;
  const ownershipWatermarkSlots = useMetricOwnershipWatermarkSlots(spec);

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

  const summarySpecOrDefault = useMemo(
    () => summarySpec ?? getDefaultSummarySpec(spec),
    [spec, summarySpec],
  );
  const resolvedComparison = useMemo(() => resolveComparisonConfig(comparison), [comparison]);
  const showComparisonChip =
    resolvedComparison.chip && summaryRendersComparisonChip(summarySpecOrDefault);

  const RAQIV2RequestOptions: MakeRAQIV2RequestOptions = useMemo(
    () => ({
      fetchTotalSeries: !hasMetricFanoutBreakdown(breakdown),
      fetchComparison: getFetchComparison(
        showComparisonChip,
        granularity,
        resolvedComparison.rangePolicy,
      ),
      // Breakdown charts strip comparison fetches by default; opt in when the
      // summary renders a period-over-period chip so it is not lost.
      allowComparisonWithBreakdown: showComparisonChip,
    }),
    [breakdown, granularity, resolvedComparison.rangePolicy, showComparisonChip],
  );

  sentryBundle.startDataLoading();
  const {
    data: raqiData,
    isDataLoading,
    isResponseFailed,
    isUserForbidden,
    error,
  } = useRAQIV2Request(spec, RAQIV2RequestOptions, ignoreCache);
  const requestStatus = useMemo(
    () => ({
      isDataLoading,
      isResponseFailed,
      isUserForbidden,
      error,
    }),
    [isDataLoading, isResponseFailed, isUserForbidden, error],
  );
  sentryBundle.handleRAQIV2RequestResult(requestStatus);

  const { chart, summary } = useMemo(
    () =>
      genericRAQIV2TimeSeriesSplineChartAdapter({
        responses: raqiData ?? { response: null },
        spec,
        translationDependencies,
        granularity,
        summarySpec: summarySpecOrDefault,
        showComparisonChip,
        numberContextMetadata: { chartSpec: spec, inRoundedComparisonChipContext },
      }),
    [
      inRoundedComparisonChipContext,
      raqiData,
      granularity,
      showComparisonChip,
      spec,
      summarySpecOrDefault,
      translationDependencies,
    ],
  );

  const exporter = useMemo(() => {
    // Pre-resolve one translation key per breakdown dimension so the
    // CSV exporter can render a compound header
    // (e.g. `"Age Group, Operating System"`) that mirrors the
    // comma-joined value cells produced by `getBreakdownName`. Empty
    // breakdown falls through to the exporter's default "Breakdown"
    // header.
    const breakColumnHeaderKeys = (breakdown ?? []).map((d) => getDimensionRenderer(d).name);
    return new TimeSeriesChartExporter(
      metricLabel,
      chart,
      translationDependencies.translate,
      titleKey ? translationDependencies.translate(titleKey) : `${resourceType}-${resourceId}`,
      breakColumnHeaderKeys,
    );
  }, [breakdown, chart, metricLabel, resourceId, resourceType, titleKey, translationDependencies]);

  const xAxisFormatter = useXAxisFormatter(locale, granularity, xAxisGranularity, chartStyleMode);

  const seriesBreakdownValues = useMemo(
    () => chart.series.map((s) => s.breakdownValues ?? []),
    [chart.series],
  );
  const getBreakdownColor = useBreakdownColors(breakdown, seriesBreakdownValues);

  const formatDataForAreaChart = useCallback(
    ({ name, dataPoints, type, custom }: SplineChartTimeSeriesNamedData, color?: ChartColor) => {
      if (!isValidArrayEnumValue(AreaSeriesDataTypes, type)) {
        throw new Error(
          `Unsupported area series data type found in chart ${chartKeyOrConfigForErrorMessage(chartKeyOrConfig)}: ${type}`,
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
        `Unsupported area series data type found in chart ${chartKeyOrConfigForErrorMessage(chartKeyOrConfig)}: ${unsupportedSeriesDataTypes.map((s) => s.type).join(', ')}`,
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
    granularity,
    series: dataForAreaChart.series,
    timeAxisSpec,
  });
  const enableMetricAwareYAxisFormatter = useMetricAwareYAxisFormatterEnabled();
  const yAxisConfig = useTimeSeriesChartYAxisConfig({
    unitSpec: chart.unit,
    translationDependencies,
    enableMetricAwareYAxisFormatter,
  });

  const { getCurrentSupportedAnnotations } = useCurrentAnnotationsBundleProvider(
    spec.resource.type,
  );
  const { timeSeriesAnnotations } = useChartTimeSeriesAnnotations({
    metric,
    getCurrentSupportedAnnotations,
    isSupportedOverride: isAnnotationSupported,
    chartBreakdown: breakdown,
    chartFilter: filter,
  });

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
  }, [onChartDataUpdated, requestStatus, summary, exporter]);

  return renderWithoutPeripherals ? (
    chartComponent
  ) : (
    <RAQIV2SingleChartCard
      titleLabel={titleKey ? translationDependencies.translate(titleKey) : ''}
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

export default GenericRAQIV2AreaChartV2;

import type { FC } from 'react';
import { useEffect, useMemo } from 'react';
import { ChartStyleMode, ColumnChart, SeriesDataTypes } from '@rbx/analytics-ui';
import TimeSeriesChartExporter from '@modules/charts-generic/charts/exporters/TimeSeriesChartExporter';
import { useXAxisFormatter } from '@modules/charts-generic/charts/formatters/axisFormatters';
import useChartSummarySpecs from '@modules/charts-generic/charts/hooks/useChartSummarySpecs';
import useTimeSeriesChartTooltipFormatters from '@modules/charts-generic/charts/hooks/useTimeSeriesChartTooltipFormatters';
import useTimeSeriesChartYAxisConfig from '@modules/charts-generic/charts/hooks/useTimeSeriesChartYAxisConfig';
import useLocale from '@modules/charts-generic/context/useLocale';
import {
  getDefaultSummarySpec,
  summaryRendersComparisonChip,
} from '../../adapters/genericRAQIV2ChartSummaryAdapter';
import genericRAQIV2TimeSeriesStackedColumnChartAdapter from '../../adapters/genericRAQIV2TimeSeriesStackedColumnChartAdapter';
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
import type { MakeRAQIV2RequestOptions } from '../../utils/makeRAQIV2Request';
import { getMetricLabelFromMetricLike } from '../../utils/metricLikeSemantics';
import resolveComparisonConfig from '../../utils/resolveComparisonConfig';
import shouldFetchTotalSeries from '../../utils/shouldFetchTotalSeries';
import getDimensionRenderer from '../getDimensionRenderer';
import genericChartStateToChartAbnormalState from './genericChartStateToChartAbnormalState';
import RAQIV2SingleChartCard from './RAQIV2SingleChartCard';
import useMetricOwnershipWatermarkSlots from './useMetricOwnershipWatermarkSlots';

const GenericRAQIV2StackedColumnChartV2: FC<GenericRAQIV2ChartProps & { stacking?: boolean }> = ({
  spec,
  chartKeyOrConfig,
  hideTotalSeriesBecauseAllBreakdownsAreUniformlyPositiveOrNegative = false,
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
  chartControl,
  chartHeight,
  inRoundedComparisonChipContext,
  renderWithoutPeripherals,
  onChartDataUpdated,
  stacking = true,
  chartBanner,
  chartLocation,
}) => {
  const { resource, granularity, breakdown, filter, metric } = spec;
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
  const { getCurrentSupportedAnnotations } = useCurrentAnnotationsBundleProvider(resource.type);

  const { timeSeriesAnnotations } = useChartTimeSeriesAnnotations({
    metric,
    getCurrentSupportedAnnotations,
    chartBreakdown: breakdown,
    chartFilter: filter,
  });

  const summarySpecOrDefault = useMemo(
    () => summarySpec ?? getDefaultSummarySpec(spec),
    [spec, summarySpec],
  );
  const resolvedComparison = useMemo(() => resolveComparisonConfig(comparison), [comparison]);
  const showComparisonChip =
    resolvedComparison.chip && summaryRendersComparisonChip(summarySpecOrDefault);

  const RAQIV2RequestOptions: MakeRAQIV2RequestOptions = useMemo(
    () => ({
      fetchTotalSeries: shouldFetchTotalSeries(
        summarySpecOrDefault,
        hideTotalSeriesBecauseAllBreakdownsAreUniformlyPositiveOrNegative,
      ),
      fetchComparison: getFetchComparison(
        showComparisonChip,
        granularity,
        resolvedComparison.rangePolicy,
      ),
      // Breakdown charts strip comparison fetches by default; opt in when the
      // summary renders a period-over-period chip so it is not lost.
      allowComparisonWithBreakdown: showComparisonChip,
    }),
    [
      hideTotalSeriesBecauseAllBreakdownsAreUniformlyPositiveOrNegative,
      granularity,
      resolvedComparison.rangePolicy,
      showComparisonChip,
      summarySpecOrDefault,
    ],
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
      genericRAQIV2TimeSeriesStackedColumnChartAdapter({
        responses: raqiData ?? { response: null },
        spec,
        translationDependencies,
        granularity,
        summarySpec: summarySpecOrDefault,
        showComparisonChip,
        hideTotalSeriesBecauseAllBreakdownsAreUniformlyPositiveOrNegative,
        numberContextMetadata: { chartSpec: spec, inRoundedComparisonChipContext },
      }),
    [
      hideTotalSeriesBecauseAllBreakdownsAreUniformlyPositiveOrNegative,
      inRoundedComparisonChipContext,
      raqiData,
      granularity,
      showComparisonChip,
      spec,
      summarySpecOrDefault,
      translationDependencies,
    ],
  );

  const xAxisType = useMemo(
    () =>
      ({
        type: 'datetime',
        granularity: xAxisGranularity,
      }) as const,
    [xAxisGranularity],
  );

  const breakdownSeriesBreakdownValues = useMemo(
    () => chart.series.map((s) => s.breakdownValues ?? []),
    [chart.series],
  );
  const getBreakdownColor = useBreakdownColors(breakdown, breakdownSeriesBreakdownValues);

  const dataForColumnChart = useMemo(() => {
    const { series } = chart;
    const hasBreakdowns = series.some((s) => !s.isTotal);

    return {
      series: series.map(({ name, dataPoints: data, isTotal, breakdownValues }) => ({
        name,
        dataPoints: data,
        type:
          hasBreakdowns && isTotal
            ? (SeriesDataTypes.Total as const)
            : (SeriesDataTypes.Normal as const),
        color: getBreakdownColor(breakdownValues ?? []),
      })),
    };
  }, [chart, getBreakdownColor]);

  const xAxisFormatter = useXAxisFormatter(locale, granularity, xAxisGranularity, chartStyleMode);

  const timeAxisSpec = useTimeAxisSpecFromChartContext({
    chartContext: spec,
  });

  const annotations = useTimeSeriesWebbloxAnnotations({
    timeSeriesAnnotations: timeSeriesAnnotations ?? getEmptyArray(),
    timeAxisSpec,
  });

  const tooltipFormatters = useTimeSeriesChartTooltipFormatters({
    chartUnitSpec: chart.unit,
    granularity,
    timeAxisSpec,
    series: dataForColumnChart.series,
  });
  const enableMetricAwareYAxisFormatter = useMetricAwareYAxisFormatterEnabled();
  const yAxisConfig = useTimeSeriesChartYAxisConfig({
    unitSpec: chart.unit,
    translationDependencies,
    enableMetricAwareYAxisFormatter,
  });

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
      titleLabel ??
        (titleKey ? translationDependencies.translate(titleKey) : undefined) ??
        `${resource.type}-${resource.id}`,
      breakColumnHeaderKeys,
    );
  }, [
    breakdown,
    chart,
    metricLabel,
    resource.id,
    resource.type,
    titleLabel,
    titleKey,
    translationDependencies,
  ]);

  const xAxisBounds: [number, number] | undefined = useMemo(
    () =>
      spec.timeAxisBounds !== 'disabled'
        ? [timeAxisSpec.startDate.getTime(), timeAxisSpec.endDate.getTime()]
        : undefined,
    [spec.timeAxisBounds, timeAxisSpec.endDate, timeAxisSpec.startDate],
  );

  const chartComponent = useMemo(
    () => (
      <ColumnChart
        data={dataForColumnChart}
        {...tooltipFormatters}
        xAxisFormatter={xAxisFormatter}
        xAxisType={xAxisType}
        yAxisConfig={yAxisConfig}
        chartStyleMode={chartStyleMode}
        onSelectChartRegion={onSelectChartRegion ?? undefined}
        annotations={annotations}
        height={chartHeight}
        xAxisBounds={xAxisBounds}
        stacking={stacking}
      />
    ),
    [
      dataForColumnChart,
      tooltipFormatters,
      xAxisFormatter,
      xAxisType,
      yAxisConfig,
      chartStyleMode,
      onSelectChartRegion,
      annotations,
      chartHeight,
      xAxisBounds,
      stacking,
    ],
  );

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

  const charSummarySpecs = useChartSummarySpecs(summary);

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

export default GenericRAQIV2StackedColumnChartV2;

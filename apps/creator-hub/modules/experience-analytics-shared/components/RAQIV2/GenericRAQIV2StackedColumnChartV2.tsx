import { FC, useEffect, useMemo } from 'react';

import {
  ChartFooter,
  SeriesIntervalMeaning,
  DailyTimeSeriesAlignedToUTCMidnight,
  TimeSeriesChartExporter,
  useChartSummarySpecs,
  useXAxisFormatter,
  useTimeSeriesChartTooltipFormatters,
  useLocale,
  useDownloadAction,
  useTimeSeriesChartYAxisConfig,
} from '@modules/charts-generic';
import {
  ChartStyleMode,
  ColumnChart,
  SingleChartCardContainer,
  SeriesDataTypes,
} from '@rbx/analytics-ui';
import useTimeAxisSpecFromChartContext from '../../hooks/useTimeAxisSpecFromChartContext';
import useSentryChartTracers from '../../hooks/useSentryChartTracers';
import RAQIV2MetricGranularityToSeriesIntervalMeaning from '../../constants/RAQIV2MetricGranularityToSeriesIntervalMeaning';
import getEmptyArray from '../../emptyArray';
import useExploreModeAction from '../../exploreMode/useExploreModeAction';
import GenericRAQIV2ChartProps from '../../types/GenericRAQIV2ChartProps';
import { getDefaultSummarySpec } from '../../adapters/genericRAQIV2ChartSummaryAdapter';
import { MakeRAQIV2RequestOptions } from '../../utils/makeRAQIV2Request';
import shouldFetchTotalSeries from '../../utils/shouldFetchTotalSeries';
import useRAQIV2Request from '../../hooks/useRAQIV2Request';
import getFetchComparison from '../../utils/getFetchComparison';
import genericRAQIV2TimeSeriesStackedColumnChartAdapter from '../../adapters/genericRAQIV2TimeSeriesStackedColumnChartAdapter';
import useCurrentAnnotationsBundleProvider from '../../hooks/useCurrentAnnotationsBundleProvider';
import useExperienceAnalyticsCurrentXAxisGranularity from '../../context/useExperienceAnalyticsCurrentXAxisGranularity';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import useTimeSeriesWebbloxAnnotations from '../../hooks/useTimeSeriesWebbloxAnnotations';
import genericChartStateToChartAbnormalState from './genericChartStateToChartAbnormalState';
import {
  getExportLabelFromMetricLike,
  getMetricLabelFromMetricLike,
} from '../../utils/metricLikeSemantics';
import useBreakdownColors from '../../hooks/useBreakdownColors';

const GenericRAQIV2StackedColumnChartV2: FC<GenericRAQIV2ChartProps & { stacking?: boolean }> = ({
  spec,
  chartKeyOrConfig,
  hideTotalSeriesBecauseAllBreakdownsAreUniformlyPositiveOrNegative = false,
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
  chartControl,
  chartHeight,
  inRoundedComparisonChipContext,
  renderWithoutPeripherals,
  onChartDataUpdated,
  stacking = true,
  chartBanner,
}) => {
  const { resource, granularity, breakdown, metric } = spec;
  const metricLabel = useMemo(() => getMetricLabelFromMetricLike(metric), [metric]);
  const exportMetric = useMemo(() => getExportLabelFromMetricLike(metric), [metric]);
  const sentryBundle = useSentryChartTracers({
    metric,
    componentKeyOrConfig: chartKeyOrConfig,
    breakdown: breakdown?.slice(),
    numExpectedPoints: 0,
  });
  const locale = useLocale();
  const translationDependencies = useRAQIV2TranslationDependencies();
  const seriesIntervalMeaning: SeriesIntervalMeaning = granularity
    ? RAQIV2MetricGranularityToSeriesIntervalMeaning(granularity)
    : DailyTimeSeriesAlignedToUTCMidnight;
  const xAxisGranularity = useExperienceAnalyticsCurrentXAxisGranularity();
  const { timeSeriesAnnotations } = useCurrentAnnotationsBundleProvider(resource.type);

  const summarySpecOrDefault = useMemo(
    () => summarySpec ?? getDefaultSummarySpec(spec),
    [spec, summarySpec],
  );

  const RAQIV2RequestOptions: MakeRAQIV2RequestOptions = useMemo(
    () => ({
      fetchTotalSeries: shouldFetchTotalSeries(
        summarySpecOrDefault,
        hideTotalSeriesBecauseAllBreakdownsAreUniformlyPositiveOrNegative,
      ),
      fetchComparison: getFetchComparison(!hideComparisonChip, seriesIntervalMeaning),
    }),
    [
      hideTotalSeriesBecauseAllBreakdownsAreUniformlyPositiveOrNegative,
      seriesIntervalMeaning,
      hideComparisonChip,
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
        seriesIntervalMeaning,
        summarySpec: summarySpecOrDefault,
        hideTotalSeriesBecauseAllBreakdownsAreUniformlyPositiveOrNegative,
        numberContextMetadata: { chartSpec: spec, inRoundedComparisonChipContext },
      }),
    [
      hideTotalSeriesBecauseAllBreakdownsAreUniformlyPositiveOrNegative,
      inRoundedComparisonChipContext,
      raqiData,
      seriesIntervalMeaning,
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

  const xAxisFormatter = useXAxisFormatter(
    locale,
    seriesIntervalMeaning,
    xAxisGranularity,
    chartStyleMode,
  );

  const timeAxisSpec = useTimeAxisSpecFromChartContext({
    chartContext: spec,
  });

  const annotations = useTimeSeriesWebbloxAnnotations({
    timeSeriesAnnotations: timeSeriesAnnotations ?? getEmptyArray(),
    timeAxisSpec,
  });

  const tooltipFormatters = useTimeSeriesChartTooltipFormatters({
    chartUnitSpec: chart.unit,
    seriesIntervalMeaning,
    timeAxisSpec,
    series: dataForColumnChart.series,
  });
  const yAxisConfig = useTimeSeriesChartYAxisConfig({
    unitSpec: chart.unit,
  });

  const exporter = useMemo(() => {
    return new TimeSeriesChartExporter(
      exportMetric,
      chart,
      translationDependencies.translate,
      titleLabel ||
        (titleKey ? translationDependencies.translate(titleKey) : undefined) ||
        `${resource.type}-${resource.id}`,
    );
  }, [
    chart,
    exportMetric,
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
      }),
    [exporter.hasEmptyData, requestStatus, translationDependencies.translate],
  );

  const charSummarySpecs = useChartSummarySpecs(summary);

  const downloadAction = useDownloadAction({
    kpiType: metricLabel,
    exporter,
  });

  const secondaryAction = useExploreModeAction(chartKeyOrConfig, spec);

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

export default GenericRAQIV2StackedColumnChartV2;

import { FC, useEffect, useMemo } from 'react';
import {
  ChartFooter,
  ChartResourceType,
  ChartUnit,
  DailyTimeSeriesAlignedToUTCMidnight,
  DurationChartExporter,
  formatChartUnit,
  makeDurationFormatter,
  useChartSummarySpecs,
  useDownloadAction,
} from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import {
  AreaChart,
  AreaSeriesDataTypes,
  ChartStyleMode,
  SeriesDataTypes,
  SingleAreaSeries,
  SingleChartCardContainer,
} from '@rbx/analytics-ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { numberFormatter } from '@rbx/core';
import { isValidArrayEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';
import useSentryChartTracers from '../../hooks/useSentryChartTracers';
import useExploreModeAction from '../../exploreMode/useExploreModeAction';
import genericRAQIV2DurationChartAdapter from '../../adapters/genericRAQIV2DurationChartAdapter';
import useRAQIV2Request from '../../hooks/useRAQIV2Request';
import { FetchComparisonSeriesMode, MakeRAQIV2RequestOptions } from '../../utils/makeRAQIV2Request';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import { isDurationBucketDimension } from '../../constants/RAQIV2DurationBucketDimensions';
import GenericRAQIV2ChartProps from '../../types/GenericRAQIV2ChartProps';
import genericChartStateToChartAbnormalState from './genericChartStateToChartAbnormalState';
import {
  getExportLabelFromMetricLike,
  getMetricLabelFromMetricLike,
} from '../../utils/metricLikeSemantics';

const xAxisType = {
  type: 'linear',
} as const;

/**
 * To use DurationSplineChart, chart spec must have a breakdown with a duration bucket dimension.
 * GenericRAQIV2DurationSplineChartWithChartSpecValidation enforces this requirement.
 */
const GenericRAQIV2DurationAreaChartV2: FC<GenericRAQIV2ChartProps> = ({
  spec,
  onSelectChartRegion,
  chartControl,
  footerProps,
  chartHeight,
  renderWithoutPeripherals,
  chartStyleMode = ChartStyleMode.Normal,
  hideComparisonChip,
  ignoreCache,
  summarySpec,
  titleKey,
  definitionTooltipKey,
  chartKeyOrConfig,
  chartWarnings,
  onChartDataUpdated,
  chartBanner,
}) => {
  const { resource, breakdown, timeSpec, metric } = spec;
  const durationBucketDimension = useMemo(
    () => breakdown?.find(isDurationBucketDimension),
    [breakdown],
  );

  if (!durationBucketDimension) {
    throw new Error(
      `To use RAQIV2DurationSplineChart, chart ${chartKeyOrConfig} must have a breakdown with a duration bucket dimension.`,
    );
  }

  const sentryBundle = useSentryChartTracers({
    metric,
    componentKeyOrConfig: chartKeyOrConfig,
    breakdown: breakdown?.slice(),
    numExpectedPoints: 0,
  });
  const translationDependencies = useRAQIV2TranslationDependencies();

  const RAQIV2RequestOptions: MakeRAQIV2RequestOptions = useMemo(
    () => ({
      fetchTotalSeries: true,
      fetchComparison: !hideComparisonChip
        ? {
            mode: FetchComparisonSeriesMode.Separate,
            seriesIntervalMeaning: DailyTimeSeriesAlignedToUTCMidnight,
          }
        : undefined,
    }),
    [hideComparisonChip],
  );

  sentryBundle.startDataLoading();
  const {
    data: raqiData,
    isDataLoading,
    isResponseFailed,
    isUserForbidden,
    // eslint-disable-next-line deprecation/deprecation -- TODO(shumingxu): Remove in DSA-4491
    isNoDataAvailable,
  } = useRAQIV2Request(spec, RAQIV2RequestOptions, ignoreCache);
  const requestStatus = useMemo(
    () => ({
      isDataLoading,
      isResponseFailed,
      isUserForbidden,
      isNoDataAvailable,
    }),
    [isDataLoading, isResponseFailed, isUserForbidden, isNoDataAvailable],
  );
  sentryBundle.handleRAQIV2RequestResult(requestStatus);

  const { chart, summary } = useMemo(() => {
    return genericRAQIV2DurationChartAdapter({
      responses: raqiData ?? { response: null },
      durationBucketDimension,
      spec,
      translationDependencies,
      showComparisonInChart: false,
      showComparisonChip: !hideComparisonChip,
      summarySpec,
    });
  }, [
    durationBucketDimension,
    raqiData,
    hideComparisonChip,
    spec,
    summarySpec,
    translationDependencies,
  ]);

  const exporter = useMemo(() => {
    return new DurationChartExporter(
      getExportLabelFromMetricLike(metric),
      chart,
      translationDependencies.translate,
      {
        startTime: timeSpec.startTime,
        endTime: timeSpec.endTime,
      },
      resource.type === ChartResourceType.Universe
        ? [
            translationDependencies.translate(
              translationKey('Label.ExperienceID', TranslationNamespace.Analytics),
            ),
            `${resource.id}`,
          ]
        : undefined,
    );
  }, [
    chart,
    metric,
    resource.id,
    resource.type,
    timeSpec.startTime,
    timeSpec.endTime,
    translationDependencies,
  ]);

  const convertedData = useMemo(() => {
    const hasNonTotalSeries = chart.series.some(({ type }) => type !== SeriesDataTypes.Total);
    const series: Array<SingleAreaSeries<number, number>> = [];
    chart.series.forEach(({ name, dataPoints, type }) => {
      if (!isValidArrayEnumValue(AreaSeriesDataTypes, type)) {
        throw new Error(
          `Unsupported area series data type found in chart ${chartKeyOrConfig}: ${type}`,
        );
      }

      if (type === SeriesDataTypes.Total && hasNonTotalSeries) {
        return;
      }

      series.push({
        name,
        type: type === SeriesDataTypes.Total ? SeriesDataTypes.Normal : type,
        dataPoints: dataPoints.map(([x, y]) => [x, y ?? null] as [number, number | null]),
      });
    });
    return {
      series,
    };
  }, [chart.series, chartKeyOrConfig]);

  const xAxisFormatter = useMemo(() => {
    return makeDurationFormatter(chart.bucketType, translationDependencies);
  }, [chart.bucketType, translationDependencies]);
  const yAxisConfig = useMemo(() => {
    // eslint-disable-next-line deprecation/deprecation -- migration in progress. Will be removed in DSA-4660.
    return chart.unit.unit === ChartUnit.Percentage ||
      chart.unit.formattingSpec?.numberFormatOptions.style === 'percent'
      ? {
          yAxisFormatter: ({ value }: { value: string | number }) => {
            const num = typeof value === 'string' ? parseFloat(value) : value;
            return `${numberFormatter(num, 'percent')}`;
          },
        }
      : undefined;
  }, [chart.unit]);

  const tooltipFormatters = useMemo(() => {
    return {
      formatSeriesKeyForPoint: ({ seriesName }: { seriesName: string }) => {
        return seriesName;
      },
      formatSeriesValueForPoint: ({ y }: { y: number }) =>
        formatChartUnit(y, chart.unit, translationDependencies),
      formatXForPoint: (x: string | number) =>
        makeDurationFormatter(chart.bucketType, translationDependencies)({ value: x }),
    };
  }, [chart.bucketType, chart.unit, translationDependencies]);

  const chartComponent = useMemo(
    () => (
      <AreaChart
        data={convertedData}
        chartStyleMode={chartStyleMode}
        xAxisFormatter={xAxisFormatter}
        xAxisType={xAxisType}
        yAxisConfig={yAxisConfig}
        onSelectChartRegion={onSelectChartRegion ?? undefined}
        tooltipFormatters={tooltipFormatters}
        height={chartHeight}
      />
    ),
    [
      convertedData,
      chartStyleMode,
      xAxisFormatter,
      yAxisConfig,
      onSelectChartRegion,
      tooltipFormatters,
      chartHeight,
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
        hasNoData: !requestStatus.isDataLoading && exporter.hasEmptyData,
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

export default GenericRAQIV2DurationAreaChartV2;

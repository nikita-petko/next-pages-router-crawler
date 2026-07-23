import { FC, useEffect, useMemo } from 'react';
import {
  ChartResourceType,
  DailyTimeSeriesAlignedToUTCMidnight,
  DurationChartExporter,
  NumberContext,
  makeDurationFormatter,
  useChartSummarySpecs,
  ChartFooter,
  useDownloadAction,
  useTimeSeriesChartYAxisConfig,
} from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ChartStyleMode, LineChart, SingleChartCardContainer } from '@rbx/analytics-ui';
import { getPredefinedChartKey } from '../../constants/RAQIV2PredefinedChartConfig';
import useSentryChartTracers from '../../hooks/useSentryChartTracers';
import useExploreModeAction from '../../exploreMode/useExploreModeAction';
import useRAQIV2Request from '../../hooks/useRAQIV2Request';
import genericRAQIV2DurationChartAdapter from '../../adapters/genericRAQIV2DurationChartAdapter';
import { FetchComparisonSeriesMode, MakeRAQIV2RequestOptions } from '../../utils/makeRAQIV2Request';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import { isDurationBucketDimension } from '../../constants/RAQIV2DurationBucketDimensions';
import GenericRAQIV2ChartProps from '../../types/GenericRAQIV2ChartProps';
import useResolvedOverlays from '../../hooks/useResolvedOverlays';
import genericChartStateToChartAbnormalState from './genericChartStateToChartAbnormalState';
import formatAnalyticsNumber from '../../utils/analyticsNumberFormatter';
import {
  getExportLabelFromMetricLike,
  getMetricLabelFromMetricLike,
} from '../../utils/metricLikeSemantics';

const DURATION_OVERLAY_DEFAULTS = { comparison: true } as const;

const xAxisType = {
  type: 'linear',
} as const;

/**
 * To use DurationSplineChart, chart spec must have a breakdown with a duration bucket dimension.
 * GenericRAQIV2DurationSplineChartWithChartSpecValidation enforces this requirement.
 */
const GenericRAQIV2DurationSplineChartV2: FC<GenericRAQIV2ChartProps> = ({
  spec,
  onSelectChartRegion,
  chartControl,
  footerProps,
  chartHeight,
  renderWithoutPeripherals,
  overlays,
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
  const { breakdown, timeSpec, metric, resource } = spec;
  const resolved = useResolvedOverlays(overlays, DURATION_OVERLAY_DEFAULTS);
  const showComparisonOverlay = resolved.comparison;
  const durationBucketDimension = useMemo(
    () => breakdown?.find(isDurationBucketDimension),
    [breakdown],
  );

  if (!durationBucketDimension) {
    const key = chartKeyOrConfig
      ? getPredefinedChartKey(chartKeyOrConfig)
      : JSON.stringify(chartKeyOrConfig);
    throw new Error(
      `To use RAQIV2DurationSplineChart, chart ${key} must have a breakdown with a duration bucket dimension.`,
    );
  }

  const sentryBundle = useSentryChartTracers({
    metric,
    componentKeyOrConfig: chartKeyOrConfig,
    breakdown: breakdown?.slice(),
    numExpectedPoints: 0,
  });
  const translationDependencies = useRAQIV2TranslationDependencies();

  const showComparisonInChartOverride = useMemo(() => {
    return showComparisonOverlay && breakdown?.every(isDurationBucketDimension);
  }, [showComparisonOverlay, breakdown]);

  const RAQIV2RequestOptions: MakeRAQIV2RequestOptions = useMemo(
    () => ({
      fetchTotalSeries: true,
      fetchComparison:
        showComparisonInChartOverride || !hideComparisonChip
          ? {
              mode: FetchComparisonSeriesMode.Separate,
              seriesIntervalMeaning: DailyTimeSeriesAlignedToUTCMidnight,
            }
          : undefined,
    }),
    [hideComparisonChip, showComparisonInChartOverride],
  );

  sentryBundle.startDataLoading();
  const {
    data: raqiData,
    isDataLoading,
    isResponseFailed,
    isUserForbidden,
    // eslint-disable-next-line deprecation/deprecation -- TODO(shumingxu): Remove in DSA-4491
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

  const { chart, summary } = useMemo(() => {
    return genericRAQIV2DurationChartAdapter({
      responses: raqiData ?? { response: null },
      durationBucketDimension,
      spec,
      translationDependencies,
      showComparisonInChart: showComparisonInChartOverride,
      showComparisonChip: !hideComparisonChip,
      summarySpec,
    });
  }, [
    durationBucketDimension,
    hideComparisonChip,
    raqiData,
    showComparisonInChartOverride,
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
  }, [chart, metric, resource, timeSpec.startTime, timeSpec.endTime, translationDependencies]);

  const convertedData = useMemo(() => {
    const series = chart.series.map(({ name, dataPoints: data, type }) => {
      return {
        name,
        type,
        dataPoints: data.map(([x, y]) => [x, y ?? null] as [number, number | null]),
      };
    });
    return {
      series,
    };
  }, [chart.series]);

  const xAxisFormatter = useMemo(() => {
    return makeDurationFormatter(chart.bucketType, translationDependencies);
  }, [chart.bucketType, translationDependencies]);

  const yAxisConfig = useTimeSeriesChartYAxisConfig({
    unitSpec: chart.unit,
  });
  const yAxisConfigs = useMemo(() => [yAxisConfig], [yAxisConfig]);

  const tooltipFormatters = useMemo(() => {
    return {
      formatSeriesKeyForPoint: ({ seriesName }: { seriesName: string }) => {
        return seriesName;
      },
      formatSeriesValueForPoint: ({ y }: { y: number }) =>
        formatAnalyticsNumber(
          y,
          {
            metric,
            context: NumberContext.DataPoint,
          },
          translationDependencies,
        ),
      formatXForPoint: (x: string | number) =>
        makeDurationFormatter(chart.bucketType, translationDependencies)({ value: x }),
    };
  }, [chart.bucketType, metric, translationDependencies]);

  const chartComponent = useMemo(
    () => (
      <LineChart
        data={convertedData}
        chartStyleMode={chartStyleMode}
        xAxisFormatter={xAxisFormatter}
        xAxisType={xAxisType}
        yAxisConfigs={yAxisConfigs}
        onSelectChartRegion={onSelectChartRegion ?? undefined}
        tooltipFormatters={tooltipFormatters}
        height={chartHeight}
      />
    ),
    [
      chartStyleMode,
      convertedData,
      onSelectChartRegion,
      chartHeight,
      tooltipFormatters,
      xAxisFormatter,
      yAxisConfigs,
    ],
  );

  const charSummarySpecs = useChartSummarySpecs(summary);
  const downloadAction = useDownloadAction({
    kpiType: getMetricLabelFromMetricLike(metric),
    exporter,
  });

  const secondaryAction = useExploreModeAction(chartKeyOrConfig, spec);
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

export default GenericRAQIV2DurationSplineChartV2;

import { useEffect, useMemo } from 'react';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import DurationChartExporter from '@modules/charts-generic/charts/exporters/DurationChartExporter';
import { makeDurationFormatter } from '@modules/charts-generic/charts/formatters/timeFormatters';
import useChartSummarySpecs from '@modules/charts-generic/charts/hooks/useChartSummarySpecs';
import ChartResourceType from '@modules/charts-generic/enums/ChartResourceType';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  getDefaultSummarySpec,
  summaryRendersComparisonChip,
} from '../adapters/genericRAQIV2ChartSummaryAdapter';
import genericRAQIV2DurationChartAdapter from '../adapters/genericRAQIV2DurationChartAdapter';
import type { ChartConfiguratorChartType } from '../chartConfigurator/ChartConfiguratorChartTypes';
import genericChartStateToChartAbnormalState from '../components/RAQIV2/genericChartStateToChartAbnormalState';
import { isDurationBucketDimension } from '../constants/RAQIV2DurationBucketDimensions';
import type GenericRAQIV2ChartProps from '../types/GenericRAQIV2ChartProps';
import getDurationFetchComparisonOptions from '../utils/getDurationFetchComparisonOptions';
import isComparisonOverlayMeaningful from '../utils/isComparisonOverlayMeaningful';
import { hasMetricFanoutBreakdown } from '../utils/isMetricFanoutDimension';
import type { MakeRAQIV2RequestOptions } from '../utils/makeRAQIV2Request';
import { getMetricLabelFromMetricLike } from '../utils/metricLikeSemantics';
import resolveComparisonConfig from '../utils/resolveComparisonConfig';
import useRAQIV2Request from './useRAQIV2Request';
import useRAQIV2TranslationDependencies from './useRAQIV2TranslationDependencies';
import useResolvedOverlays from './useResolvedOverlays';
import useSentryChartTracers from './useSentryChartTracers';

/**
 * Shared data-fetching and adapter logic for all duration chart variants.
 * Each chart component calls this hook then renders its own chart primitive
 * with the returned data.
 */
const useDurationChartData = (
  props: GenericRAQIV2ChartProps,
  chartType: ChartConfiguratorChartType,
) => {
  const {
    spec,
    comparison,
    ignoreCache,
    summarySpec,
    chartKeyOrConfig,
    onChartDataUpdated,
    overlays,
  } = props;
  const { breakdown, timeSpec, metric, resource } = spec;

  const durationBucketDimension = useMemo(
    () => breakdown?.find(isDurationBucketDimension),
    [breakdown],
  );

  if (!durationBucketDimension) {
    throw new Error(
      `Duration chart requires a breakdown with a duration bucket dimension (chart: ${JSON.stringify(chartKeyOrConfig)}).`,
    );
  }

  const sentryBundle = useSentryChartTracers({
    metric,
    componentKeyOrConfig: chartKeyOrConfig,
    breakdown: breakdown?.slice(),
    numExpectedPoints: 0,
  });
  const translationDependencies = useRAQIV2TranslationDependencies();
  const metricLabel = useMemo(
    () => getMetricLabelFromMetricLike(metric, translationDependencies),
    [metric, translationDependencies],
  );
  const resolvedOverlays = useResolvedOverlays(overlays, { chartType, breakdown });
  const showComparisonInChart = resolvedOverlays.comparison;
  const resolvedComparison = useMemo(() => resolveComparisonConfig(comparison), [comparison]);
  const showComparisonChip =
    resolvedComparison.chip &&
    summaryRendersComparisonChip(summarySpec ?? getDefaultSummarySpec(spec));
  // A duration chart's breakdown always contains its duration bucket, so the
  // request layer would otherwise strip the comparison fetch via
  // `stripFetchComparisonForBreakdown`. Opt in when the comparison is valid for
  // this breakdown (same rule as the overlay default) so the data is fetched.
  const allowComparisonWithBreakdown = isComparisonOverlayMeaningful({ chartType, breakdown });

  const RAQIV2RequestOptions: MakeRAQIV2RequestOptions = useMemo(
    () => ({
      fetchTotalSeries: !hasMetricFanoutBreakdown(breakdown),
      fetchComparison: getDurationFetchComparisonOptions({
        showComparisonChip,
        showComparisonInChart,
        rangePolicy: resolvedComparison.rangePolicy,
        comparisonOffset: resolvedOverlays.comparisonOffset,
        comparisonCustomStartDate: resolvedOverlays.comparisonCustomStartDate,
      }),
      allowComparisonWithBreakdown,
    }),
    [
      allowComparisonWithBreakdown,
      breakdown,
      resolvedOverlays.comparisonOffset,
      resolvedOverlays.comparisonCustomStartDate,
      resolvedComparison.rangePolicy,
      showComparisonChip,
      showComparisonInChart,
    ],
  );

  sentryBundle.startDataLoading();
  const {
    data: raqiData,
    isDataLoading,
    isResponseFailed,
    isUserForbidden,
    // eslint-disable-next-line deprecation/deprecation, @typescript-eslint/no-deprecated -- TODO(shumingxu): Remove in DSA-4491
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
      genericRAQIV2DurationChartAdapter({
        responses: raqiData ?? { response: null },
        durationBucketDimension,
        spec,
        translationDependencies,
        showComparisonInChart,
        showComparisonChip,
        summarySpec,
      }),
    [
      durationBucketDimension,
      raqiData,
      showComparisonChip,
      showComparisonInChart,
      spec,
      summarySpec,
      translationDependencies,
    ],
  );

  const exporter = useMemo(
    () =>
      new DurationChartExporter(
        metricLabel,
        chart,
        translationDependencies.translate,
        { startTime: timeSpec.startTime, endTime: timeSpec.endTime },
        resource.type === ChartResourceType.Universe
          ? [
              translationDependencies.translate(
                translationKey('Label.ExperienceID', TranslationNamespace.Analytics),
              ),
              `${resource.id}`,
            ]
          : undefined,
      ),
    [chart, metricLabel, resource, timeSpec.startTime, timeSpec.endTime, translationDependencies],
  );

  const xAxisFormatter = useMemo(
    () => makeDurationFormatter(chart.bucketType, translationDependencies),
    [chart.bucketType, translationDependencies],
  );

  const abnormalState = useMemo(
    () =>
      genericChartStateToChartAbnormalState({
        state: requestStatus,
        hasNoData: !requestStatus.isDataLoading && exporter.hasEmptyData,
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

  const chartSummarySpecs = useChartSummarySpecs(summary);

  useEffect(() => {
    onChartDataUpdated?.({
      chartState: requestStatus,
      summaryItems: summary,
      exporter,
    });
  }, [onChartDataUpdated, requestStatus, summary, exporter]);

  return {
    chart,
    summary,
    requestStatus,
    exporter,
    xAxisFormatter,
    abnormalState,
    chartSummarySpecs,
    metricLabel,
    translationDependencies,
  };
};

export default useDurationChartData;

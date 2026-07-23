import { useCallback, useMemo } from 'react';
import {
  DailyTimeSeriesAlignedToUTCMidnight,
  SplineChartTimeSeriesNamedData,
  getTypeLegendDescription,
  ChartSummaryItemSpec,
  TimeSeriesSplineChartSpec,
} from '@modules/charts-generic';
import { FormattedText } from '@modules/analytics-translations';
import { RAQIV2MetricToSupportedDimensions } from '@rbx/creator-hub-analytics-config';
import { SeriesDataTypes } from '@rbx/analytics-ui';
import RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';
import useRAQIV2TranslationDependencies from './useRAQIV2TranslationDependencies';
import RAQIV2MetricGranularityToSeriesIntervalMeaning from '../constants/RAQIV2MetricGranularityToSeriesIntervalMeaning';
import { maybeThrowRAQIV2InternalException } from '../utils/RAQIV2InternalException';
import makeRAQIV2Request, { FetchComparisonOptions } from '../utils/makeRAQIV2Request';
import { useRAQIV2Client } from '../context/RAQIV2ClientProvider';
import useApiRequest from './useApiRequest';
import { RAQIV2CompoundDoubleMetricSummaryType } from '../enums/RAQIV2SummaryType';
import genericRAQIV2TimeSeriesDoubleMetricSummaryAdapter from '../adapters/genericRAQIV2TimeSeriesDoubleMetricSummaryAdapter';
import genericRAQIV2TimeSeriesSplineChartAdapter from '../adapters/genericRAQIV2TimeSeriesSplineChartAdapter';
import { noSummarySpec } from '../adapters/genericRAQIV2ChartSummaryAdapter';
import { RAQIV2TranslationDependencies } from '../types/RAQIV2DimensionRenderer';
import { type TRAQIV2NumericUIMetric } from '../constants/AnalyticsMetricDisplayConfig';

export type AnalyticsQuotaProps = {
  mainSpec: RAQIV2ChartSpec;
  mainChart: TimeSeriesSplineChartSpec;
  summarySpec: RAQIV2CompoundDoubleMetricSummaryType[];
  quotaMetric: TRAQIV2NumericUIMetric | undefined;
  fetchComparison?: FetchComparisonOptions;
  inRoundedComparisonChipContext?: boolean;
  ignoreCache?: boolean;
};

const decorateQuotaSeries = (
  series: SplineChartTimeSeriesNamedData[],
  translationDependencies: RAQIV2TranslationDependencies,
) => {
  return series
    .filter((s) => s.type !== SeriesDataTypes.Comparison)
    .map((s) => ({
      ...s,
      type: SeriesDataTypes.Quota,
      name:
        getTypeLegendDescription(SeriesDataTypes.Quota, translationDependencies.translate) ??
        ('' as FormattedText),
    }));
};

export const useAnalyticsQuota = ({
  mainSpec,
  mainChart,
  summarySpec,
  quotaMetric,
  fetchComparison,
  inRoundedComparisonChipContext,
  ignoreCache,
}: AnalyticsQuotaProps): {
  chartWithQuota: TimeSeriesSplineChartSpec;
  quotaSummary: ChartSummaryItemSpec[];
} => {
  const translationDependencies = useRAQIV2TranslationDependencies();
  const { client, clearCache } = useRAQIV2Client(ignoreCache ?? false);

  const quotaSpec = useMemo(() => {
    if (
      !quotaMetric ||
      mainChart.series.length === 0 ||
      (mainSpec.breakdown && mainSpec.breakdown?.length > 0)
    ) {
      // simulate the behavior of benchmark, don't show quota when breakdown is present
      return null;
    }
    const quotaFilter = quotaMetric
      ? mainSpec.filter?.filter((filterDimension) =>
          RAQIV2MetricToSupportedDimensions[quotaMetric].includes(filterDimension.dimension),
        )
      : undefined;
    return {
      // breakdown not supported for quota metric
      resource: mainSpec.resource,
      metric: quotaMetric,
      filter: quotaFilter,
      timeSpec: mainSpec.timeSpec,
      granularity: mainSpec.granularity,
      // We don't need to use the page-wide time axis here since quotas are never shown on their own
      timeAxisBounds: null,
    };
  }, [quotaMetric, mainSpec, mainChart]);

  const quotaRequestOptions = useMemo(
    () => ({
      fetchComparison,
      allowComputedMetrics: false,
    }),
    [fetchComparison],
  );

  const makeQuotaRequest = useCallback(async () => {
    if (!quotaSpec) {
      return Promise.resolve(null);
    }
    maybeThrowRAQIV2InternalException(quotaSpec.resource, 'makeQuotaRequest');
    return makeRAQIV2Request(quotaSpec, client, quotaRequestOptions);
  }, [client, quotaRequestOptions, quotaSpec]);

  const { data } = useApiRequest(makeQuotaRequest, {
    invalidateCache: ignoreCache ? clearCache : undefined,
  });

  return useMemo(() => {
    if (!mainChart || !quotaSpec || !data) {
      return { chartWithQuota: mainChart, quotaSummary: [] };
    }
    const { chart } = genericRAQIV2TimeSeriesSplineChartAdapter({
      responses: data,
      spec: quotaSpec,
      translationDependencies,
      seriesIntervalMeaning: quotaSpec.granularity
        ? RAQIV2MetricGranularityToSeriesIntervalMeaning(quotaSpec.granularity)
        : DailyTimeSeriesAlignedToUTCMidnight,
      showComparisonInChart: true,
      summarySpec: noSummarySpec,
    });

    const quotaSeries = decorateQuotaSeries(chart.series, translationDependencies);
    const summary =
      mainChart.series.length === 0 || chart.series.length === 0
        ? []
        : genericRAQIV2TimeSeriesDoubleMetricSummaryAdapter({
            spec: mainSpec,
            charts: [mainChart, chart],
            translationDependencies,
            seriesIntervalMeaning: quotaSpec.granularity
              ? RAQIV2MetricGranularityToSeriesIntervalMeaning(quotaSpec.granularity)
              : DailyTimeSeriesAlignedToUTCMidnight,
            summarySpec,
            numberContextMetadata: { chartSpec: mainSpec, inRoundedComparisonChipContext },
          });

    const mainSeriesWithoutComparison = mainChart.series.filter(
      (s) => s.type !== SeriesDataTypes.Comparison,
    );
    return {
      chartWithQuota: {
        ...mainChart,
        series: [...mainSeriesWithoutComparison, ...quotaSeries],
      },
      quotaSummary: summary,
    };
  }, [
    data,
    inRoundedComparisonChipContext,
    mainChart,
    mainSpec,
    quotaSpec,
    summarySpec,
    translationDependencies,
  ]);
};

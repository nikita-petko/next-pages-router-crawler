import type { SinglePieSeries } from '@rbx/analytics-ui';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { FormattedText } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { TimeSeriesInfo } from '@modules/charts-generic/charts/types/TimeSeriesTypes';
import ChartSummaryType from '@modules/charts-generic/enums/ChartSummaryType';
import type { RAQIV2BreakdownValue } from '@modules/clients/analytics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';
import type { RAQIV2TranslationDependencies } from '../types/RAQIV2DimensionRenderer';
import type { RAQIV2QueryResponses } from '../utils/combineRAQIV2QueryResponses';
import combineRAQIV2QueryResponses from '../utils/combineRAQIV2QueryResponses';
import { getMetricLabelFromMetricLike } from '../utils/metricLikeSemantics';
import { ingestAllRaqiV2Series } from './genericRAQIV2ChartAdapter';
import type { RAQIV2SummarySpec } from './genericRAQIV2ChartSummaryAdapter';
import {
  getSummarizeValueForSingleSeries,
  summarizeSeriesInfo,
} from './genericRAQIV2ChartSummaryAdapter';

const MAX_PIE_CHART_SERIES = 9;

export type PieSeriesWithBreakdowns = {
  series: SinglePieSeries<string, number>;
  sliceBreakdownValues: Array<RAQIV2BreakdownValue[]>;
};

// NOTE(lucaswang, 10/14/2025): Only exported for testing purposes
export const buildPieSeries = (
  metricSeries: TimeSeriesInfo[],
  metric: RAQIV2ChartSpec['metric'],
  translationDependencies: RAQIV2TranslationDependencies,
): PieSeriesWithBreakdowns => {
  const { translate } = translationDependencies;
  const chartDisplayName = getMetricLabelFromMetricLike(metric, translationDependencies);

  const nonTotalSeries = metricSeries.filter(
    (series) => !series.isTotalSeries && !series.isComparisonSeries && series.dataPoints.length > 0,
  );
  const seriesForChart =
    nonTotalSeries.length > 0
      ? nonTotalSeries
      : metricSeries.filter(
          (series) =>
            series.isTotalSeries && !series.isComparisonSeries && series.dataPoints.length > 0,
        );

  // Aggregate data points within each selected series.
  const seriesDataPoints = seriesForChart
    .map((series) => {
      // Use the unified summary logic to get the total sum for each series
      const totalValue = getSummarizeValueForSingleSeries(series, {
        type: ChartSummaryType.Total,
      });

      return {
        name: series.name,
        value: totalValue,
        breakdownValues: series.breakdownValues,
        series,
      };
    })
    .filter(({ value }) => value > 0) // Only include positive values
    .sort((a, b) => b.value - a.value); // Sort by value descending for consistent top-N selection

  type SliceEntry = { name: FormattedText; value: number; breakdownValues: RAQIV2BreakdownValue[] };

  // If we have more series than the maximum, group the excess into "Other"
  let finalSlices: SliceEntry[];

  if (seriesDataPoints.length > MAX_PIE_CHART_SERIES) {
    const otherLabel = translate(translationKey('Label.Other', TranslationNamespace.Analytics));

    // Separate existing "Other" series from non-"Other" series
    const existingOtherSeries = seriesDataPoints.filter(({ name }) => name === otherLabel);
    const nonOtherSeries = seriesDataPoints.filter(({ name }) => name !== otherLabel);

    // Take top 9 non-"Other" series
    const topNonOtherSeries = nonOtherSeries.slice(0, MAX_PIE_CHART_SERIES);
    const remainingNonOtherSeries = nonOtherSeries.slice(MAX_PIE_CHART_SERIES);

    // Combine all "Other" values: existing "Other" series + remaining non-"Other" series
    const combinedOtherValue = [...existingOtherSeries, ...remainingNonOtherSeries].reduce(
      (sum, { value }) => sum + value,
      0,
    );

    // Create final list with top non-"Other" series + combined "Other"
    const allFinalSeries: SliceEntry[] = [
      ...topNonOtherSeries.map(({ name, value, breakdownValues }) => ({
        name,
        value,
        breakdownValues,
      })),
      { name: otherLabel, value: combinedOtherValue, breakdownValues: [] },
    ];

    allFinalSeries.sort((a, b) => b.value - a.value);
    finalSlices = allFinalSeries;
  } else {
    finalSlices = seriesDataPoints.map(({ name, value, breakdownValues }) => ({
      name,
      value,
      breakdownValues,
    }));
  }

  return {
    series: {
      name: chartDisplayName,
      dataPoints: finalSlices.map(({ name, value }) => [name, value] as [FormattedText, number]),
    },
    sliceBreakdownValues: finalSlices.map(({ breakdownValues }) => breakdownValues),
  };
};

type GenericRAQIV2PieChartAdapterProps = {
  responses: RAQIV2QueryResponses;
  spec: RAQIV2ChartSpec;
  translationDependencies: RAQIV2TranslationDependencies;
  summarySpec?: RAQIV2SummarySpec;
};

const genericRAQIV2PieChartAdapter = ({
  responses,
  spec,
  summarySpec,
  translationDependencies,
}: GenericRAQIV2PieChartAdapterProps) => {
  const { response } = combineRAQIV2QueryResponses(responses);

  const { series: metricSeries } = ingestAllRaqiV2Series({
    response,
    spec,
    translationDependencies,
    granularity: RAQIV2MetricGranularity.None,
  });

  const summary = summarySpec
    ? summarizeSeriesInfo(metricSeries, spec, summarySpec, translationDependencies, null)
    : [];

  const { series, sliceBreakdownValues } = buildPieSeries(
    metricSeries,
    spec.metric,
    translationDependencies,
  );

  return {
    series,
    sliceBreakdownValues,
    summary,
  };
};

export default genericRAQIV2PieChartAdapter;

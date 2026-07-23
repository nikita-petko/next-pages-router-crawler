import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { ChartSummaryItemSpec } from '@modules/charts-generic/charts/ChartSummaryItem';
import type { BarSeriesEntry } from '@modules/charts-generic/charts/types/HorizontalBarChartTypes';
import SeriesTypes from '@modules/charts-generic/charts/types/SeriesTypes';
import type { TimeSeriesInfo } from '@modules/charts-generic/charts/types/TimeSeriesTypes';
import type { RAQIV2BreakdownValue } from '@modules/clients/analytics';
import type { TGenericRAQIV2Sort } from '../constants/RAQIV2PredefinedChartConfig';
import type RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';
import type { RAQIV2TranslationDependencies } from '../types/RAQIV2DimensionRenderer';
import type { RAQIV2QueryResponses } from '../utils/combineRAQIV2QueryResponses';
import combineRAQIV2QueryResponses from '../utils/combineRAQIV2QueryResponses';
import {
  getIsPositiveGoodFromMetricLike,
  getMetricLabelFromMetricLike,
} from '../utils/metricLikeSemantics';
import { getFirstDataPointValue, ingestAllRaqiV2Series } from './genericRAQIV2ChartAdapter';
import type { RAQIV2SummarySpec } from './genericRAQIV2ChartSummaryAdapter';
import { summarizeSeriesInfo } from './genericRAQIV2ChartSummaryAdapter';

export type BarSeriesEntryWithBreakdowns = BarSeriesEntry & {
  breakdownValues: RAQIV2BreakdownValue[];
};

const buildBarSeries = (
  metricSeries: TimeSeriesInfo[],
  metric: RAQIV2ChartSpec['metric'],
  translationDependencies: RAQIV2TranslationDependencies,
  total: number | null,
  sort?: TGenericRAQIV2Sort,
): BarSeriesEntryWithBreakdowns[] => {
  const metricDisplayName = getMetricLabelFromMetricLike(metric, translationDependencies);
  const sortDescending = getIsPositiveGoodFromMetricLike(metric);
  // Remove total series unless it is the only one
  const nonTotalSeries = metricSeries.filter(
    (series) => !series.isTotalSeries && series.dataPoints.length > 0,
  );
  const seriesForChart =
    nonTotalSeries.length > 0
      ? nonTotalSeries
      : metricSeries.filter((series) => series.isTotalSeries && series.dataPoints.length > 0);
  let resultSeries: BarSeriesEntryWithBreakdowns[] = seriesForChart.map((series) => {
    const dataPoint = getFirstDataPointValue(series.dataPoints);
    return {
      type: SeriesTypes.Bar,
      data: [
        {
          name: series.name,
          y: dataPoint ?? 0,
          percentage: total && dataPoint != null ? dataPoint / total : undefined,
          'hc-key': series.breakdownValues[0]?.value?.toLowerCase() ?? '',
        },
      ],
      name: metricDisplayName,
      breakdownValues: series.breakdownValues,
    };
  });
  if (sort?.byBreakdownTotal) {
    resultSeries = resultSeries.sort((a, b) => {
      const aData = a.data[0].y;
      const bData = b.data[0].y;
      if (aData === bData) {
        return 0;
      }
      if (sortDescending) {
        return aData > bData ? -1 : 1;
      }
      return aData < bData ? -1 : 1;
    });
  }
  return resultSeries;
};

type GenericRAQIV2HorizontalBarChartAdapterProps = {
  responses: RAQIV2QueryResponses;
  spec: RAQIV2ChartSpec;
  summarySpec?: RAQIV2SummarySpec;
  translationDependencies: RAQIV2TranslationDependencies;
  labelDataAsPercent?: boolean;
  sort?: TGenericRAQIV2Sort;
  breakdownLimit?: number;
};
const genericRAQIV2HorizontalBarChartAdapter = ({
  responses,
  spec,
  summarySpec,
  translationDependencies,
  labelDataAsPercent,
  sort,
  breakdownLimit,
}: GenericRAQIV2HorizontalBarChartAdapterProps): {
  series: BarSeriesEntryWithBreakdowns[];
  summary: Array<ChartSummaryItemSpec>;
} => {
  const { response } = combineRAQIV2QueryResponses(responses);

  const { series: metricSeries } = ingestAllRaqiV2Series({
    response,
    spec,
    translationDependencies,
    granularity: RAQIV2MetricGranularity.None,
  });

  // Note since map and bar charts usually use non-time series charts,
  // the summarySpec usually won't have an impact on the final summary result as the total series will only contain one point
  // which is already the total over all breakdowns.
  const summary = summarySpec
    ? summarizeSeriesInfo(metricSeries, spec, summarySpec, translationDependencies, null)
    : [];

  const totalSeries = metricSeries.find((series) => series.isTotalSeries);
  if (!totalSeries && labelDataAsPercent) {
    // totalSeries is empty so we can't label data by percent
    return { series: [], summary };
  }
  const total =
    labelDataAsPercent && totalSeries ? getFirstDataPointValue(totalSeries.dataPoints) : null;
  let resultSeries = buildBarSeries(
    metricSeries,
    spec.metric,
    translationDependencies,
    total,
    sort,
  );
  if (breakdownLimit) {
    resultSeries = resultSeries.slice(0, breakdownLimit);
  }
  return { series: resultSeries, summary };
};

export default genericRAQIV2HorizontalBarChartAdapter;

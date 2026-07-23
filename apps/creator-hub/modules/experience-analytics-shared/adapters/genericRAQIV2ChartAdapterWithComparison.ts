import { RAQIV2QueryResult } from '@modules/clients/analytics';
import { TNumberContextMetadata, getComparisonTimeRange } from '@modules/charts-generic';
import {
  GenericRaqiV2ChartAdapterSpec,
  ingestAllRaqiV2Series,
  ingestRaqiV2ComparisonSeries,
} from './genericRAQIV2ChartAdapter';
import { RAQIV2SummarySpec, summarizeSeriesInfo } from './genericRAQIV2ChartSummaryAdapter';

export const adaptAllRaqiV2SeriesWithComparisonAndSummary = (
  spec: GenericRaqiV2ChartAdapterSpec,
  summarySpec: RAQIV2SummarySpec,
  comparisonResponse?: RAQIV2QueryResult,
  numberContextMetadata?: TNumberContextMetadata,
) => {
  const { series, timestamps } = ingestAllRaqiV2Series(spec);
  const { spec: chartSpec, translationDependencies, seriesIntervalMeaning } = spec;
  const { comparisonStartDate, comparisonEndDate } = getComparisonTimeRange(
    chartSpec.timeSpec.startTime,
    chartSpec.timeSpec.endTime,
    seriesIntervalMeaning,
  );
  const rawComparisonSeries = comparisonResponse
    ? ingestAllRaqiV2Series({
        ...spec,
        response: comparisonResponse,
        spec: {
          ...chartSpec,
          timeSpec: {
            ...chartSpec.timeSpec,
            startTime: comparisonStartDate,
            endTime: comparisonEndDate,
          },
        },
      }).series
    : undefined;
  const comparisonSeries = rawComparisonSeries
    ? ingestRaqiV2ComparisonSeries({
        rawComparisonSeries,
        translationDependencies: spec.translationDependencies,
        originalTimestamps: timestamps,
      })
    : undefined;
  const summary = summarizeSeriesInfo(
    series,
    chartSpec,
    summarySpec,
    translationDependencies,
    rawComparisonSeries
      ? {
          series: rawComparisonSeries,
          startTime: comparisonStartDate,
          endTime: comparisonEndDate,
        }
      : null,
    numberContextMetadata,
  );
  return { series, timestamps, summary, comparisonSeries };
};

export default adaptAllRaqiV2SeriesWithComparisonAndSummary;

import { useMemo } from 'react';
import { DailyTimeSeriesAlignedToUTCMidnight } from '@modules/charts-generic';
import RAQIV2MetricGranularityToSeriesIntervalMeaning from '../constants/RAQIV2MetricGranularityToSeriesIntervalMeaning';
import RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';
import getFetchComparison from '../utils/getFetchComparison';
import { MakeRAQIV2RequestOptions } from '../utils/makeRAQIV2Request';
import useRAQIV2Request from './useRAQIV2Request';
import combineRAQIV2QueryResponses from '../utils/combineRAQIV2QueryResponses';
import adaptAllRaqiV2SeriesWithComparisonAndSummary from '../adapters/genericRAQIV2ChartAdapterWithComparison';
import useRAQIV2TranslationDependencies from './useRAQIV2TranslationDependencies';
import { RAQIV2CompoundSummaryType } from '../enums/RAQIV2SummaryType';

const useRAQIV2Summary = (
  spec: RAQIV2ChartSpec,
  summaryType: RAQIV2CompoundSummaryType,
  ignoreCache?: boolean,
) => {
  const translationDependencies = useRAQIV2TranslationDependencies();
  const seriesIntervalMeaning = spec.granularity
    ? RAQIV2MetricGranularityToSeriesIntervalMeaning(spec.granularity)
    : DailyTimeSeriesAlignedToUTCMidnight;

  const metricSummaryRequestOptions: MakeRAQIV2RequestOptions = useMemo(
    () => ({
      fetchTotalSeries: true,
      fetchComparison: getFetchComparison(true, seriesIntervalMeaning),
    }),
    [seriesIntervalMeaning],
  );

  const { data: raqiData, ...chartState } = useRAQIV2Request(
    spec,
    metricSummaryRequestOptions,
    ignoreCache,
  );

  const { response, comparisonResponse } = combineRAQIV2QueryResponses(
    raqiData ?? { response: null },
  );
  const { summary } = adaptAllRaqiV2SeriesWithComparisonAndSummary(
    {
      response,
      translationDependencies,
      seriesIntervalMeaning,
      spec,
    },
    {
      totalSummaryTypes: [summaryType],
      perBreakdownSummaryTypes: [],
      aggregatedBreakdownSummaryTypes: [],
    },
    comparisonResponse,
  );

  return useMemo(
    () => ({
      summary: summary.length ? summary[0] : null,
      ...chartState,
    }),
    [chartState, summary],
  );
};

export default useRAQIV2Summary;

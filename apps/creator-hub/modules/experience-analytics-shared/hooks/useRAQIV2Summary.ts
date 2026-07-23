import { useMemo } from 'react';
import adaptAllRaqiV2SeriesWithComparisonAndSummary from '../adapters/genericRAQIV2ChartAdapterWithComparison';
import type { RAQIV2CompoundSummaryType } from '../enums/RAQIV2SummaryType';
import type RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';
import combineRAQIV2QueryResponses from '../utils/combineRAQIV2QueryResponses';
import getFetchComparison from '../utils/getFetchComparison';
import type { MakeRAQIV2RequestOptions } from '../utils/makeRAQIV2Request';
import useRAQIV2Request from './useRAQIV2Request';
import useRAQIV2TranslationDependencies from './useRAQIV2TranslationDependencies';

const useRAQIV2Summary = (
  spec: RAQIV2ChartSpec,
  summaryType: RAQIV2CompoundSummaryType,
  ignoreCache?: boolean,
) => {
  const translationDependencies = useRAQIV2TranslationDependencies();
  const granularity = spec.granularity;

  const metricSummaryRequestOptions: MakeRAQIV2RequestOptions = useMemo(
    () => ({
      fetchTotalSeries: true,
      fetchComparison: getFetchComparison(true, granularity),
    }),
    [granularity],
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
      granularity,
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

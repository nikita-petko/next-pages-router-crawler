import type { RAQIV2SummarySpec } from '../adapters/genericRAQIV2ChartSummaryAdapter';

const shouldFetchTotalSeries = (
  summarySpec: RAQIV2SummarySpec | null,
  hideTotalSeriesBecauseAllBreakdownsAreUniformlyPositiveOrNegative?: boolean,
) => {
  const hasTotalSummary =
    summarySpec?.totalSummaryTypes && summarySpec?.totalSummaryTypes.length > 0;
  // generally we do need to fetch the total series
  return (
    !hideTotalSeriesBecauseAllBreakdownsAreUniformlyPositiveOrNegative || Boolean(hasTotalSummary)
  );
};

export default shouldFetchTotalSeries;

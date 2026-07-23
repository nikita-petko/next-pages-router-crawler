import { RAQIV2QueryResult } from '@modules/clients/analytics';

// NOTE(shumingxu, 02/02/2024): This is very similar to analyticsComparisonCombinedRequestAdapter but
// but with RAQI V2 refactoring and single chart view, I want to encourage using a single genericRAQIV2RequestAdapter.
// Hence this only deals with the RAQIV2QueryResult and we leave all adapter work within genericRAQIV2RequestAdapter.
const sliceRAQIV2QueryResultByTimeRange = (
  result: RAQIV2QueryResult,
  startTime: Date,
  endTime: Date,
): RAQIV2QueryResult => {
  if (!result.values) {
    return {};
  }
  const startTimestamp = startTime.getTime();
  const endTimestamp = endTime.getTime();
  return {
    values: result.values.map((metricValue) => ({
      breakdownValue: metricValue.breakdownValue,
      dataPoints: metricValue.dataPoints?.filter((dataPoint) => {
        if (!dataPoint.time) {
          return false;
        }
        const dataPointTimestamp = new Date(dataPoint.time).getTime();
        return dataPointTimestamp >= startTimestamp && dataPointTimestamp <= endTimestamp;
      }),
    })),
  };
};

export default sliceRAQIV2QueryResultByTimeRange;

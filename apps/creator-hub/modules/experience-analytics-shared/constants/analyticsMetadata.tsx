import { alignToUTCMidnight } from '@modules/charts-generic';

export const yearsAgoUTCMidnight = (years: number) => {
  let date = new Date();
  // provide 1 more day to account for the current day in progress which cannot be available
  date.setHours(-24);
  date = alignToUTCMidnight(date);
  date.setFullYear(date.getFullYear() - years);
  return date;
};

/**
 * This was data previously provided by AggregationMetadataResponse
 * from the developer-analytics-aggregations/v1/metadata endpoint.
 * This was sometimes a source of failed requests, and always increased TTI latency.
 *
 * But it is simple enough that we can easily define it statically, so now we do.
 */
export const minimalDateForQuerying = yearsAgoUTCMidnight(2);
export const defaultDataPointsForQuerying = 28;

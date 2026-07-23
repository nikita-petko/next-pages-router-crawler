import type { RAQIV2QueryResult } from '@modules/clients/analytics';

export type RAQIV2QueryResponses = {
  response: RAQIV2QueryResult | null;
  comparisonResponse?: RAQIV2QueryResult;
  totalSeriesResponse?: RAQIV2QueryResult;
  totalSeriesComparisonResponse?: RAQIV2QueryResult;
};

const combineRAQIV2QueryResponses = (
  responses: RAQIV2QueryResponses,
): {
  response: RAQIV2QueryResult | null;
  comparisonResponse?: RAQIV2QueryResult;
} => {
  const hasResponse = responses.response || responses.totalSeriesResponse;
  const hasComparison = responses.totalSeriesComparisonResponse || responses.comparisonResponse;
  return {
    response: hasResponse
      ? {
          values: [
            ...(responses.totalSeriesResponse?.values ?? []),
            ...(responses.response?.values ?? []),
          ],
        }
      : null,
    comparisonResponse: hasComparison
      ? {
          values: [
            ...(responses.totalSeriesComparisonResponse?.values ?? []),
            ...(responses.comparisonResponse?.values ?? []),
          ],
        }
      : undefined,
  };
};

export default combineRAQIV2QueryResponses;

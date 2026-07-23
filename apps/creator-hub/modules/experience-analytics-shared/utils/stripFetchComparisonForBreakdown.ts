import type { RAQIV2UIQueryRequest } from '../types/RAQIV2UIQueryRequest';
import type { MakeRAQIV2RequestOptions } from './makeRAQIV2Request';

/**
 * Breakdown charts do not support period-over-period comparison in the UI unless the
 * caller opts in (comparison overlay or metric quota). Strip accidental comparison fetches
 * at the request layer so all chart types get consistent behavior.
 */
const stripFetchComparisonForBreakdown = (
  request: Pick<RAQIV2UIQueryRequest, 'breakdown'>,
  options?: MakeRAQIV2RequestOptions,
): MakeRAQIV2RequestOptions | undefined => {
  if (!options?.fetchComparison) {
    return options;
  }
  const hasBreakdown = (request.breakdown?.length ?? 0) > 0;
  if (hasBreakdown && !options.allowComparisonWithBreakdown) {
    return {
      ...options,
      fetchComparison: undefined,
    };
  }
  return options;
};

export default stripFetchComparisonForBreakdown;

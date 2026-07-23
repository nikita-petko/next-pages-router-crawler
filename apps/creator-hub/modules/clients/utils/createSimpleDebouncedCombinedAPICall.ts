/**
 * Creates a debounced function that combines multiple API calls into a single request.
 *
 * This is useful for cases where you have "batch" APIs (e.g. you can fetch multiple items at once) and
 * you're fetching multiple items (e.g. each table row fetches data) but don't want to introduce a lot of
 * state management or complexity.
 *
 * This approach keeps things very simple by creating a new pseudo-api endpoint that will combine with
 * other API calls transparently.
 *
 * Example:
 * ```
 * const debouncedGameDetails = createSimpleDebouncedCombinedAPICall({
 *   apiCall: (universeIds) => gamesClient.getDetails(universeIds),
 *   // can shorten to
 *   // apiCall: gamesClient.getDetails,
 *
 *   // function to take the batch result and find the specific result for a parameter
 *   getResult: (results, universeId, index) => {
 *     const game = results?.data?.find((aGame) => aGame.id === universeId);
 *     return game;
 *   },
 *
 *   // time to wait for additional request before making
 *   // an actual API call.
 *   debounceTime: 10,
 *
 *   // max number of params to include in a single API call
 *   maxBatchSize: 50,
 * });
 *
 * // make three pseudo-API calls
 * const promise1 = debouncedGameDetails(1);
 * const promise2 = debouncedGameDetails(2);
 * const promise3 = debouncedGameDetails(3);
 *
 * // this will only make one actual API call.
 * ```
 *
 * The function is generic, so it should return correct types.
 *
 * It has at least two limitations:
 * - It doesn't dedupe multiple calls with the same params.
 * - It expects only one positional parameter.
 */
const createSimpleDebouncedCombinedAPICall = <TParam, TResults, TResult>({
  apiCall,
  getResult,
  maxBatchSize,
  debounceTime = 10,
}: {
  /**
   * The API call to make.
   */
  apiCall: (params: TParam[]) => Promise<TResults>;
  /**
   * A function to take the batch result and find the specific result for a parameter.
   * Be aware of APIs that don't guarantee order of results, so best to utilize find + id.
   */
  getResult: (results: TResults, param: TParam, index: number) => TResult;
  /**
   * The maximum number of params to include in a single API call.
   * When exceeding this, the function will make multiple API calls within the same debounceTime.
   */
  maxBatchSize: number;
  /**
   * The time to wait for additional requests before making an actual API call.
   */
  debounceTime?: number;
}) => {
  let pendingCallInfo: { params: TParam[]; promise: Promise<TResults> }[] = [];

  return async (param: TParam) => {
    const lastPendingCallInfo = pendingCallInfo[pendingCallInfo.length - 1];
    // Note: this could be further optimized to make a call immediately instead of waiting for debounceTime
    // if we hit the maxBatchSize (at the cost of complexity).
    if (!lastPendingCallInfo || lastPendingCallInfo.params.length >= maxBatchSize) {
      const newPendingCallInfo = {
        params: [param],
        promise: new Promise<TResults>((resolve, reject) => {
          setTimeout(() => {
            const { params } = newPendingCallInfo;
            try {
              apiCall(params).then(resolve).catch(reject);
            } catch (error) {
              reject(error);
            } finally {
              pendingCallInfo = pendingCallInfo.filter(
                (callInfo) => callInfo !== newPendingCallInfo,
              );
            }
          }, debounceTime);
        }),
      };
      pendingCallInfo.push(newPendingCallInfo);
      return newPendingCallInfo.promise.then((results) => getResult(results, param, 0));
    }
    lastPendingCallInfo.params.push(param);
    const index = lastPendingCallInfo.params.length - 1;
    return lastPendingCallInfo.promise.then((results) => getResult(results, param, index));
  };
};

export default createSimpleDebouncedCombinedAPICall;

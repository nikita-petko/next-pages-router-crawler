/**
 * This memoize function caches the results of a function that accepts a single parameter.
 * It uses a Map, so it will handle primitive data type parameters or objects, but
 *  CAUTION: using this on functions that accept object parameters will retain the
 *  object parameters in memory indefinitely.
 */
function mapMemoizeSingleParamFunction<TParam, TReturn>(
  fn: (param: TParam) => TReturn,
): (param: TParam) => TReturn {
  const seen = new Map();
  return (param: TParam) => {
    if (seen.has(param)) {
      return seen.get(param);
    }
    const result = fn(param);
    seen.set(param, result);
    return result;
  };
}

export default mapMemoizeSingleParamFunction;

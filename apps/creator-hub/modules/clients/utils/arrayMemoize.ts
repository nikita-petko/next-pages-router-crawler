// Since the functions we can memoize can have any type of arguments,
//  we need to be able to accept any array of parameters
//
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ArrayOfAny = Array<any>;

function defaultEquals<TParams extends ArrayOfAny>(cachedArgs: TParams, args: TParams): boolean {
  return cachedArgs.every((cachedArg, idx) => {
    return cachedArg === args[idx];
  });
}

/**
 * CAUTION: using this on functions that accept or return object parameters will retain in memory
 *  ALL object parameters and results, until the `reset` function is called.
 *
 * @param fn the function to be memoized can accept both primitive data type parameters
 *  and object arguments. Results are cached by retaining the array of all arguments passed
 *  into the memoized function, along with their results.
 *
 * @param compareFn compares the array of arguments passed with the cached array.
 *  Useful if objects or arrays are passed as arguments to `fn`.
 *
 * @returns a (memoized) function object with a `reset` function provided, which allows
 *  the caller to clear the cache (and thus free up memory used by previous args and returns).
 */
export default function arrayMemoize<TParams extends ArrayOfAny, TReturn>(
  fn: (...args: TParams) => TReturn,
  compareFn?: (a: TParams, b: TParams) => boolean,
): ((...args: TParams) => TReturn) & { reset: VoidFunction } {
  const equals = compareFn ?? defaultEquals;
  const seen: Array<[TParams, TReturn]> = [];
  const memoized = (...args: TParams): TReturn => {
    const prior = seen.find(([cachedArgs]) => {
      return equals(cachedArgs, args);
    });
    if (prior) {
      return prior[1];
    }
    const result = fn(...args);
    seen.push([args, result]);
    return result;
  };
  memoized.reset = () => {
    seen.splice(0, seen.length);
  };
  return memoized;
}

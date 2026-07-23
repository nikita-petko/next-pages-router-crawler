/**
 * Retry options loosely based on `UseMutationOptions`
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/reference/useMutation
 */
export type RetryOptions<TError = Error> = {
  retry?: number;
  retryDelay?: number | ((retryAttempt: number, error: TError) => number);
};

export async function retryAsync<T, TError = Error>(
  fn: () => Promise<T>,
  { retry = 0, retryDelay = 0 }: RetryOptions<TError> = {},
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retry > 0) {
      const delay =
        typeof retryDelay === 'function' ? retryDelay(retry, error as TError) : retryDelay;

      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryAsync(fn, { retry: retry - 1, retryDelay });
    }
    throw error;
  }
}

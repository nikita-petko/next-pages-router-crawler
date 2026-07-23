/**
 * Centralized request manager to handle race conditions in API calls.
 * Provides automatic cancellation of stale requests and request ID tracking.
 */

/**
 * Checks if an error is an abort/cancellation error from either native fetch or axios.
 * @param error The error to check
 * @returns True if the error is an abort error (AbortError from fetch or CanceledError from axios)
 */
export const isAbortError = (error: unknown): boolean =>
  error instanceof Error && (error.name === 'AbortError' || error.name === 'CanceledError');

/**
 * Creates a request manager that handles request cancellation and tracking.
 * Only the most recent request's response will be processed.
 *
 * @example
 * const manager = createRequestManager();
 * const result = await manager.executeRequest(async (abortSignal) => {
 *   return api.get({ url: '/data', abortSignal });
 * });
 */
export const createRequestManager = () => {
  let currentRequestId = 0;
  let currentAbortController: AbortController | null = null;

  return {
    /**
     * Cancels the current pending request if one exists.
     */
    cancel: () => {
      currentAbortController?.abort();
      currentAbortController = null;
    },

    /**
     * Executes a request with automatic cancellation of previous pending requests.
     * @param requestFn Function that performs the API call, receives an AbortSignal
     * @returns Promise that resolves with the response or null if cancelled/superseded
     */
    executeRequest: async <T>(
      requestFn: (signal: AbortSignal) => Promise<T>,
    ): Promise<T | null> => {
      // Abort previous request if it exists
      currentAbortController?.abort();

      // Create new request
      const abortController = new AbortController();
      currentRequestId += 1;
      const requestId = currentRequestId;
      currentAbortController = abortController;

      try {
        const result = await requestFn(abortController.signal);

        // Only return result if this is still the current request
        if (currentRequestId === requestId) {
          currentAbortController = null; // Clean up after success
          return result;
        }
        return null; // Superseded
      } catch (error) {
        // Ignore abort errors or superseded request errors
        if (isAbortError(error) || currentRequestId !== requestId) {
          return null;
        }
        throw error; // Re-throw actual errors
      }
    },

    /**
     * Resets the request manager state.
     */
    reset: () => {
      currentAbortController?.abort();
      currentAbortController = null;
      currentRequestId = 0;
    },
  };
};

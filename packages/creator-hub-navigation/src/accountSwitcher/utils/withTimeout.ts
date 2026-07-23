export const DEFAULT_TIMEOUT_MS = 20000;

class TimeoutError extends Error {
  operation: string;

  constructor(operation: string, timeoutMs: number) {
    super(`Operation: ${operation} timed out after ${timeoutMs} ms.`);
    this.name = 'TimeoutError';
    this.operation = operation;
  }
}

export type TimeoutExecutorParams<T> = {
  onSuccess: (value: T) => void;
  onError: (error: Error) => void;
  onTimeout: (fn: () => void) => void;
};

/**
 * Function that wraps an asynchronous operation with a timeout.
 * If the operation does not complete within the specified timeout,
 * the promise is rejected with a TimeoutError.
 *
 * @param operation - A string identifier for the operation (used in error messages).
 * @param executor - A function that receives callbacks to signal success, error, or timeout.
 * @param timeoutMs - Customizable timeout in ms (default is DEFAULT_TIMEOUT_MS).
 * @returns A promise that resolves with the operation result or rejects on error/timeout.
 */
export function withTimeout<T>(
  operation: string,
  executor: (params: TimeoutExecutorParams<T>) => void,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  return new Promise((resolve, reject) => {
    let timeoutCallback: (() => void) | undefined;

    const timeout = setTimeout(() => {
      timeoutCallback?.();
      reject(new TimeoutError(operation, timeoutMs));
    }, timeoutMs);

    executor({
      onSuccess: (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      onError: (error) => {
        clearTimeout(timeout);
        reject(error);
      },
      onTimeout: (fn) => {
        timeoutCallback = fn;
      },
    });
  });
}

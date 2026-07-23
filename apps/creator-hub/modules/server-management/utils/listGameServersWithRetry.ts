import { StatusCodes } from '@rbx/core';
import { getResponseFromError } from '@modules/clients/utils';
import { SERVER_LIST_QUERY_CONSTANTS } from '../constants';

export function isRetriableGatewayError(error: unknown): boolean {
  const status = getResponseFromError(error)?.status;
  return (
    status === StatusCodes.BAD_GATEWAY ||
    status === StatusCodes.GATEWAY_TIMEOUT ||
    status === StatusCodes.SERVICE_UNAVAILABLE ||
    status === StatusCodes.REQUEST_TIMEOUT
  );
}

function createAbortError(): DOMException {
  return new DOMException('The operation was aborted', 'AbortError');
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw createAbortError();
  }
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  throwIfAborted(signal);

  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timeoutId);
      reject(createAbortError());
    };
    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export default async function listGameServersWithRetry<T>(
  request: () => Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  const { MAX_RETRIES, RETRY_BASE_DELAY_MS, RETRY_BACKOFF_BASE } = SERVER_LIST_QUERY_CONSTANTS;
  let attempt = 0;

  while (true) {
    throwIfAborted(signal);

    try {
      return await request();
    } catch (error) {
      throwIfAborted(signal);

      if (!isRetriableGatewayError(error) || attempt >= MAX_RETRIES) {
        throw error;
      }
      attempt += 1;
      await wait(RETRY_BASE_DELAY_MS * RETRY_BACKOFF_BASE ** (attempt - 1), signal);
    }
  }
}

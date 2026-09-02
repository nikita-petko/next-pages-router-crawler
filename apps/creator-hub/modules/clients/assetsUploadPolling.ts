import assetsUploadApiClient from './assetsupload';

// The polling pattern for calling assets upload api is documented here:
// https://roblox.atlassian.net/wiki/spaces/CON/pages/2493153717/Asset+Media+APIs+Migration+Guide

const pollingIntervalSeconds = 1;
const pollingMaxRetries = 25;

interface PollForCompletedOperationOptions {
  returnNullOnTimeout?: boolean;
}

function createAbortError(): Error {
  if (typeof DOMException !== 'undefined') {
    return new DOMException('The operation was aborted.', 'AbortError');
  }
  const error = new Error('The operation was aborted.');
  error.name = 'AbortError';
  return error;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw createAbortError();
  }
}

function waitForPollInterval(signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }
    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, 1000 * pollingIntervalSeconds);
    const onAbort = () => {
      clearTimeout(timeoutId);
      reject(createAbortError());
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export async function pollForCompletedOperation(
  operationId: string,
  currentAttempt: number,
  signal?: AbortSignal,
  options: PollForCompletedOperationOptions = {},
): Promise<number | null> {
  throwIfAborted(signal);
  const operation = await assetsUploadApiClient.getOperationStatus(operationId);
  throwIfAborted(signal);
  const isOperationDone = operation?.done ?? false;

  if (isOperationDone && operation?.error == null) {
    return operation?.response?.assetId ?? null;
  }

  if (isOperationDone && operation?.error != null) {
    throw new Error(operation.error.message ?? 'Asset upload failed');
  }

  if (currentAttempt > pollingMaxRetries) {
    if (options.returnNullOnTimeout === true) {
      return null;
    }
    throw new Error('Exceeded polling retry limit');
  }

  await waitForPollInterval(signal);

  return pollForCompletedOperation(operationId, currentAttempt + 1, signal, options);
}

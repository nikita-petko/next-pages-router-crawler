import assetsUploadApiClient from './assetsupload';

// The polling pattern for calling assets upload api is documented here:
// https://roblox.atlassian.net/wiki/spaces/CON/pages/2493153717/Asset+Media+APIs+Migration+Guide

const pollingIntervalSeconds = 1;
const pollingMaxRetries = 25;

export async function pollForCompletedOperation(
  operationId: string,
  currentAttempt: number,
): Promise<number | null> {
  const operation = await assetsUploadApiClient.getOperationStatus(operationId);
  const isOperationDone = operation?.done ?? false;

  if (isOperationDone && operation?.error == null) {
    return operation?.response?.assetId ?? null;
  }

  if (currentAttempt > pollingMaxRetries || (isOperationDone && operation?.error != null)) {
    throw new Error(operation?.error?.message ?? 'Exceeded polling retry limit');
  }

  await new Promise<void>((resolve) => {
    setTimeout(resolve, 1000 * pollingIntervalSeconds);
  });

  return pollForCompletedOperation(operationId, currentAttempt + 1);
}

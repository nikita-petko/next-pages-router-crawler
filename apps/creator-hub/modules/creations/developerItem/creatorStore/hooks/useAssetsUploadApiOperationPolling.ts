import assetsUploadApiClient from '@modules/clients/assetsupload';
import { useTranslation } from '@rbx/intl';
import { useCallback } from 'react';

const OPERATION_STATUS_POLLING_MAX_RETRIES = 10;
const OPERATION_STATUS_POLLING_INTERVAL_SECONDS = 1;

export interface AssetsUploadApiOperationPollingContext {
  pollForCompletedOperation: (operationId: string, currentAttempt?: number) => Promise<void>;
}

const useAssetsUploadApiOperationPolling = (
  maxRetries: number = OPERATION_STATUS_POLLING_MAX_RETRIES,
  intervalSeconds: number = OPERATION_STATUS_POLLING_INTERVAL_SECONDS,
): AssetsUploadApiOperationPollingContext => {
  const { translate } = useTranslation();

  const pollForCompletedOperation = useCallback(
    async (operationId: string, currentAttempt: number = 0) => {
      const operation = await assetsUploadApiClient.getOperationStatus(operationId);
      const isOperationDone = operation?.done ?? false;

      // Operation completed successfully
      if (isOperationDone && operation?.error == null) {
        return;
      }

      if (currentAttempt > maxRetries) {
        // eslint-disable-next-line no-console -- This is a developer-facing error
        console.error('Operation timed out', operation);
        throw new Error(translate('Error.OperationFailed'));
      }

      if (isOperationDone && operation?.error != null) {
        throw new Error(operation.error.message ?? translate('Error.OperationFailed'));
      }

      await new Promise((r) => setTimeout(r, 1000 * intervalSeconds));
      await pollForCompletedOperation(operationId, currentAttempt + 1);
    },
    [intervalSeconds, maxRetries, translate],
  );

  return {
    pollForCompletedOperation,
  };
};

export default useAssetsUploadApiOperationPolling;

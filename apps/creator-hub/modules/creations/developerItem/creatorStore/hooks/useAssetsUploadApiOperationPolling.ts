import { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import assetsUploadApiClient, {
  getAssetsUploadOperationErrorMessage,
} from '@modules/clients/assetsupload';

const OPERATION_STATUS_POLLING_MAX_RETRIES = 10;
const OPERATION_STATUS_POLLING_INTERVAL_SECONDS = 1;

export interface AssetsUploadApiOperationPollingContext {
  pollForCompletedOperation: (operationId: string) => Promise<void>;
}

// Maps extracted API error strings to user-facing translation keys.
function mapAssetsUploadOperationErrorMessage(
  message: string,
  translate: (key: string) => string,
): string {
  if (/must be a square/i.test(message)) {
    return translate('Error.IconMustBeSquare');
  }

  return translate('Error.OperationFailed');
}

const useAssetsUploadApiOperationPolling = (
  maxRetries: number = OPERATION_STATUS_POLLING_MAX_RETRIES,
  intervalSeconds: number = OPERATION_STATUS_POLLING_INTERVAL_SECONDS,
): AssetsUploadApiOperationPollingContext => {
  const { translate } = useTranslation();

  const pollForCompletedOperation = useCallback(
    async (operationId: string) => {
      let currentAttempt = 0;

      while (true) {
        // TODO STM-8914: use getOperationStatus once Operation.metadata is in @rbx/client-assets-upload-api.
        const operation = await assetsUploadApiClient.getOperationStatusRaw(operationId);
        const isOperationDone = operation?.done ?? false;

        if (isOperationDone && operation?.error == null) {
          return;
        }

        if (isOperationDone && operation?.error != null) {
          const rawErrorMessage = getAssetsUploadOperationErrorMessage(operation, '');
          throw new Error(mapAssetsUploadOperationErrorMessage(rawErrorMessage, translate));
        }

        if (currentAttempt > maxRetries) {
          console.error('Operation timed out', operation);
          throw new Error(translate('Error.OperationFailed'));
        }

        await new Promise<void>((resolve) => {
          setTimeout(resolve, 1000 * intervalSeconds);
        });
        currentAttempt += 1;
      }
    },
    [intervalSeconds, maxRetries, translate],
  );

  return {
    pollForCompletedOperation,
  };
};

export default useAssetsUploadApiOperationPolling;

import { useCallback } from 'react';
import {
  OperationStatus,
  GetDeepCopyOperationStatusResponse,
  ErrorCode,
} from '@rbx/clients/creatorAssetToolingApi/v1';
import { creatorAssetToolingClient } from '@modules/clients';

// Exponential backoff: 5, 5+1, 5+2, 5+4, 5+8, ... (capped by maxBackoffSeconds)
const OPERATION_STATUS_POLLING_MAX_RETRIES = 8;
const OPERATION_STATUS_POLLING_BASE_DELAY_SECONDS = 5;
const OPERATION_STATUS_POLLING_MAX_BACKOFF_SECONDS = 20;
const API_CALL_MAX_RETRIES = 3;

// Regex pattern to split error messages by common delimiters
const ERROR_MESSAGE_DELIMITER_PATTERN = /[,;|\s]+/;

export interface DeepCopyResponse extends GetDeepCopyOperationStatusResponse {
  parsedErrorCodes?: ErrorCode[];
}

export interface CreatorAssetToolingDeepCopyContext {
  deepCopyAndWait: (params: {
    sourceAssetId: number;
    destinationAssetName: string;
  }) => Promise<DeepCopyResponse>;
}

/**
 * Parses ErrorCodes from the operationErrorMessage string.
 * The backend joins error codes with commas, e.g., "AssetNotFound,InvalidRequest"
 * This function splits by delimiters and matches against known ErrorCode values.
 */
function parseErrorCodesFromMessage(message: string | null | undefined): ErrorCode[] {
  if (!message) {
    return [];
  }

  const knownErrorCodes = Object.values(ErrorCode);
  const segments = message
    .split(ERROR_MESSAGE_DELIMITER_PATTERN)
    .map((s) => s.trim())
    .filter(Boolean); // Remove empty segments

  return knownErrorCodes.filter((code) => segments.includes(code));
}

const useCreatorAssetToolingDeepCopy = (
  maxRetries: number = OPERATION_STATUS_POLLING_MAX_RETRIES,
  baseDelaySeconds: number = OPERATION_STATUS_POLLING_BASE_DELAY_SECONDS,
  maxBackoffSeconds: number = OPERATION_STATUS_POLLING_MAX_BACKOFF_SECONDS,
): CreatorAssetToolingDeepCopyContext => {
  const withRetry = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    let lastError: Error | unknown;

    for (let attempt = 0; attempt <= API_CALL_MAX_RETRIES; attempt += 1) {
      try {
        // eslint-disable-next-line no-await-in-loop -- Sequential API calls are required for retry logic
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt < API_CALL_MAX_RETRIES) {
          // eslint-disable-next-line no-await-in-loop -- Sequential delays are required for retry logic
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }

    throw lastError;
  }, []);

  const pollForCompletedOperation = useCallback(
    async (
      operationId: string,
      currentAttempt: number = 0,
    ): Promise<GetDeepCopyOperationStatusResponse> => {
      const statusResponse = await withRetry(() =>
        creatorAssetToolingClient.getOperationStatus(operationId),
      );

      if (statusResponse?.status !== OperationStatus.InProgress) {
        return statusResponse;
      }

      if (currentAttempt > maxRetries) {
        throw new Error('Deep copy operation timed out.');
      }

      // Backoff sequence:
      // attempt 0: 5
      // attempt 1: 5 + 1
      // attempt 2: 5 + 2
      // attempt 3: 5 + 4
      // attempt 4: 5 + 8
      // ...
      const incremental = currentAttempt === 0 ? 0 : 2 ** (currentAttempt - 1);
      const delaySeconds = Math.min(baseDelaySeconds + incremental, maxBackoffSeconds);
      await new Promise((r) => setTimeout(r, 1000 * delaySeconds));
      return pollForCompletedOperation(operationId, currentAttempt + 1);
    },
    [baseDelaySeconds, maxBackoffSeconds, maxRetries, withRetry],
  );

  const deepCopyAndWait = useCallback(
    async (params: {
      sourceAssetId: number;
      destinationAssetName: string;
    }): Promise<DeepCopyResponse> => {
      const { sourceAssetId, destinationAssetName } = params;
      const createDeepCopyResponse = await withRetry(() =>
        creatorAssetToolingClient.createDeepCopy({
          sourceAssetId,
          destinationAssetName,
        }),
      );

      if (!createDeepCopyResponse?.operationId || createDeepCopyResponse?.operationError) {
        throw new Error(
          createDeepCopyResponse?.operationError?.operationErrorMessage ??
            'Failed to start deep copy operation.',
        );
      }

      const response = await pollForCompletedOperation(createDeepCopyResponse.operationId);

      const parsedErrorCodes = parseErrorCodesFromMessage(
        response.operationError?.operationErrorMessage,
      );

      return {
        ...response,
        parsedErrorCodes,
      };
    },
    [pollForCompletedOperation, withRetry],
  );

  return { deepCopyAndWait };
};

export default useCreatorAssetToolingDeepCopy;

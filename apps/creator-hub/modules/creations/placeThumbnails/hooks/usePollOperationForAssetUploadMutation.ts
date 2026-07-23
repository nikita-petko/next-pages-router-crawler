import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import assetsUploadApiClient from '@modules/clients/assetsupload';
import useProgressTracker from './useProgressTracker';

export class PollOperationNotDoneError extends Error {
  public status = 418; // I'm a teapot
}

const usePollOperationForAssetUploadMutation = (
  onSuccess?: () => void,
  onError?: () => void,
  onProgress?: (progress: number) => void,
  maxPolls = 25, // max retires for polling
  pollInterval = 1000, // default polling interval: 1s
) => {
  const progressTracker = useProgressTracker(onProgress);

  const {
    mutate: pollForCompletedOperation,
    mutateAsync: pollForCompletedOperationAsync,
    isPending: isPolling,
    isError: isPollingError,
  } = useMutation({
    mutationFn: async (operationId: string) => {
      if (onProgress) {
        const { operation, metadata } =
          await assetsUploadApiClient.getOperationStatusWithMetadata(operationId);

        if (!operation?.done) {
          progressTracker.handleRealProgress(metadata?.progress);
          throw new PollOperationNotDoneError();
        }

        return operation;
      }

      const operation = await assetsUploadApiClient.getOperationStatus(operationId);
      if (!operation?.done) {
        throw new PollOperationNotDoneError();
      }

      return operation;
    },
    retry: (failureCount, error) => {
      if (error instanceof PollOperationNotDoneError) {
        if (onProgress) {
          progressTracker.handleFallbackProgress(failureCount, maxPolls);
        }
        return failureCount < maxPolls;
      }
      return false;
    },
    retryDelay: pollInterval,
    onSuccess: () => {
      if (onProgress) {
        progressTracker.reportComplete();
        progressTracker.reset();
      }
      onSuccess?.();
    },
    onError,
    throwOnError: false,
  });

  return useMemo(
    () => ({
      pollForCompletedOperation,
      pollForCompletedOperationAsync,
      isPolling,
      isPollingError,
    }),
    [isPolling, isPollingError, pollForCompletedOperation, pollForCompletedOperationAsync],
  );
};

export default usePollOperationForAssetUploadMutation;

import { useCallback, useMemo, useState } from 'react';
import type { UseQueryOptions } from '@tanstack/react-query';
import { useQueries } from '@tanstack/react-query';
import type { Operation } from '@rbx/client-assets-upload-api/v1';
import { ModerationState } from '@rbx/client-assets-upload-api/v1';
import assetsUploadApiClient, { FieldMask } from '@modules/clients/assetsupload';
import type {
  AssetsUploadOperationRecord,
  AssetsUploadOperationStatusDetails,
} from './assetsUploadOperationStatusTypes';
import {
  AssetsUploadOperationStatus,
  ASSETS_UPLOAD_POLLING_INTERVAL_MS,
  ASSETS_UPLOAD_POLLING_MAX_RETRIES,
  getAssetsUploadModerationStatusQueryKey,
  getAssetsUploadOperationStatusQueryKey,
} from './assetsUploadOperationStatusTypes';

const MODERATION_POLLING_INTERVAL_MS = 1000;
const MODERATION_POLLING_MAX_RETRIES = 5;
const MODERATION_RESULT_FIELD_MASK_ARRAY = [FieldMask.MODERATION_RESULT];

const getAssetModerationState = async (assetId: number): Promise<ModerationState> => {
  const assetDetails = await assetsUploadApiClient.getAsset(
    assetId,
    MODERATION_RESULT_FIELD_MASK_ARRAY,
  );

  return assetDetails.moderationResult?.moderationState ?? ModerationState.Unspecified;
};

const parseAssetId = (assetIdRaw: number | string | undefined | null): number | undefined => {
  if (assetIdRaw == null) {
    return undefined;
  }

  return typeof assetIdRaw === 'number' ? assetIdRaw : parseInt(assetIdRaw, 10);
};

const getModerationStateFromOperation = (operation: Operation | undefined): ModerationState =>
  operation?.response?.moderationResult?.moderationState ?? ModerationState.Unspecified;

const isTerminalModerationState = (moderationState: ModerationState): boolean =>
  moderationState === ModerationState.Approved || moderationState === ModerationState.Rejected;

const shouldPollModeration = (
  record: AssetsUploadOperationRecord,
): record is AssetsUploadOperationRecord & {
  assetId: number;
  initialModerationState: ModerationState;
} =>
  record.phase === 'moderation' &&
  record.uploadStatus === 'complete' &&
  record.assetId != null &&
  record.initialModerationState != null &&
  record.initialModerationState !== ModerationState.Approved;

const updateOperationRecord = (
  previousRecords: Record<string, AssetsUploadOperationRecord>,
  operationId: string,
  nextRecord: AssetsUploadOperationRecord,
): Record<string, AssetsUploadOperationRecord> => ({
  ...previousRecords,
  [operationId]: nextRecord,
});

const buildUploadStatusDetails = (
  record: AssetsUploadOperationRecord,
): AssetsUploadOperationStatusDetails => {
  if (record.phase === 'upload') {
    if (record.uploadStatus === 'failed') {
      return {
        status: AssetsUploadOperationStatus.UploadFailed,
        errorMessage: record.errorMessage,
      };
    }

    if (record.uploadStatus === 'timed_out') {
      return { status: AssetsUploadOperationStatus.UploadTimedOut };
    }

    return { status: AssetsUploadOperationStatus.Uploading };
  }

  if (record.phase === 'moderation') {
    if (record.moderationState === ModerationState.Approved) {
      return {
        status: AssetsUploadOperationStatus.Approved,
        assetId: record.assetId,
        moderationState: record.moderationState,
      };
    }

    if (record.moderationState === ModerationState.Rejected) {
      return {
        status: AssetsUploadOperationStatus.Rejected,
        assetId: record.assetId,
        moderationState: record.moderationState,
      };
    }

    if (record.moderationTimedOut) {
      return {
        status: AssetsUploadOperationStatus.ModerationPending,
        assetId: record.assetId,
        moderationState: record.moderationState,
      };
    }

    return {
      status: AssetsUploadOperationStatus.Moderating,
      assetId: record.assetId,
      moderationState: record.moderationState,
    };
  }

  if (record.uploadStatus === 'failed') {
    return {
      status: AssetsUploadOperationStatus.UploadFailed,
      errorMessage: record.errorMessage,
    };
  }

  if (record.uploadStatus === 'timed_out') {
    return { status: AssetsUploadOperationStatus.UploadTimedOut };
  }

  if (record.moderationState === ModerationState.Rejected) {
    return {
      status: AssetsUploadOperationStatus.Rejected,
      assetId: record.assetId,
      moderationState: record.moderationState,
    };
  }

  if (record.moderationTimedOut) {
    return {
      status: AssetsUploadOperationStatus.ModerationPending,
      assetId: record.assetId,
      moderationState: record.moderationState,
    };
  }

  return {
    status: AssetsUploadOperationStatus.Approved,
    assetId: record.assetId,
    moderationState: record.moderationState ?? ModerationState.Approved,
  };
};

const applyUploadQueryErrorTransition = (
  previousRecords: Record<string, AssetsUploadOperationRecord>,
  operationId: string,
  errorMessage: string,
): Record<string, AssetsUploadOperationRecord> => {
  const currentRecord = previousRecords[operationId];
  if (!currentRecord || currentRecord.phase !== 'upload') {
    return previousRecords;
  }

  return updateOperationRecord(previousRecords, operationId, {
    ...currentRecord,
    phase: 'terminal',
    uploadStatus: 'failed',
    errorMessage,
  });
};

const applyUploadQueryResultTransition = (
  previousRecords: Record<string, AssetsUploadOperationRecord>,
  operationId: string,
  operation: Operation | undefined,
  uploadPollingMaxRetries: number,
): Record<string, AssetsUploadOperationRecord> => {
  const currentRecord = previousRecords[operationId];
  if (!currentRecord || currentRecord.phase !== 'upload') {
    return previousRecords;
  }

  const nextRecord = {
    ...currentRecord,
    uploadPollAttempts: (currentRecord.uploadPollAttempts ?? 0) + 1,
  };
  const pollCount = nextRecord.uploadPollAttempts ?? 0;
  const isOperationDone = operation?.done ?? false;

  if (!isOperationDone) {
    if (pollCount >= uploadPollingMaxRetries) {
      return updateOperationRecord(previousRecords, operationId, {
        ...nextRecord,
        phase: 'terminal',
        uploadStatus: 'timed_out',
      });
    }

    return updateOperationRecord(previousRecords, operationId, nextRecord);
  }

  if (operation?.error != null) {
    return updateOperationRecord(previousRecords, operationId, {
      ...nextRecord,
      phase: 'terminal',
      uploadStatus: 'failed',
      errorMessage: operation.error.message ?? 'Upload operation failed',
    });
  }

  const assetId = parseAssetId(operation?.response?.assetId);
  const initialModerationState = getModerationStateFromOperation(operation);

  if (assetId == null) {
    return updateOperationRecord(previousRecords, operationId, {
      ...nextRecord,
      phase: 'terminal',
      uploadStatus: 'failed',
      errorMessage: 'Missing asset ID',
    });
  }

  if (initialModerationState === ModerationState.Approved) {
    return updateOperationRecord(previousRecords, operationId, {
      ...nextRecord,
      phase: 'terminal',
      uploadStatus: 'complete',
      assetId,
      initialModerationState,
      moderationState: initialModerationState,
    });
  }

  if (initialModerationState === ModerationState.Rejected) {
    return updateOperationRecord(previousRecords, operationId, {
      ...nextRecord,
      phase: 'terminal',
      uploadStatus: 'complete',
      assetId,
      initialModerationState,
      moderationState: initialModerationState,
    });
  }

  return updateOperationRecord(previousRecords, operationId, {
    ...nextRecord,
    phase: 'moderation',
    uploadStatus: 'complete',
    assetId,
    initialModerationState,
    moderationState: initialModerationState,
  });
};

const applyModerationQueryErrorTransition = (
  previousRecords: Record<string, AssetsUploadOperationRecord>,
  operationId: string,
): Record<string, AssetsUploadOperationRecord> => {
  const currentRecord = previousRecords[operationId];
  if (!currentRecord || currentRecord.phase !== 'moderation' || currentRecord.moderationTimedOut) {
    return previousRecords;
  }

  return updateOperationRecord(previousRecords, operationId, {
    ...currentRecord,
    moderationTimedOut: true,
  });
};

const applyModerationQueryResultTransition = (
  previousRecords: Record<string, AssetsUploadOperationRecord>,
  operationId: string,
  moderationState: ModerationState,
  moderationPollingMaxRetries: number,
): Record<string, AssetsUploadOperationRecord> => {
  const currentRecord = previousRecords[operationId];
  if (!currentRecord || currentRecord.phase !== 'moderation') {
    return previousRecords;
  }

  const nextRecord = {
    ...currentRecord,
    moderationPollAttempts: (currentRecord.moderationPollAttempts ?? 0) + 1,
    moderationState,
  };
  const pollCount = nextRecord.moderationPollAttempts ?? 0;

  if (isTerminalModerationState(moderationState)) {
    return updateOperationRecord(previousRecords, operationId, {
      ...nextRecord,
      phase: 'terminal',
      moderationTimedOut: false,
    });
  }

  if (pollCount >= moderationPollingMaxRetries) {
    if (currentRecord.moderationTimedOut) {
      return previousRecords;
    }

    return updateOperationRecord(previousRecords, operationId, {
      ...nextRecord,
      moderationTimedOut: true,
    });
  }

  return updateOperationRecord(previousRecords, operationId, nextRecord);
};

export interface UseAssetsUploadOperationStatusPollingOptions {
  uploadPollingIntervalMs?: number;
  uploadPollingMaxRetries?: number;
  moderationPollingIntervalMs?: number;
  moderationPollingMaxRetries?: number;
}

export interface UseAssetsUploadOperationStatusPollingResult {
  addOperationId: (operationId: string) => void;
  getUploadStatus: (operationId: string) => AssetsUploadOperationStatusDetails;
  uploadingOperationIds: string[];
  moderatingOperationIds: string[];
}

const useAssetsUploadOperationStatusPolling = (
  options: UseAssetsUploadOperationStatusPollingOptions = {},
): UseAssetsUploadOperationStatusPollingResult => {
  const {
    uploadPollingIntervalMs = ASSETS_UPLOAD_POLLING_INTERVAL_MS,
    uploadPollingMaxRetries = ASSETS_UPLOAD_POLLING_MAX_RETRIES,
    moderationPollingIntervalMs = MODERATION_POLLING_INTERVAL_MS,
    moderationPollingMaxRetries = MODERATION_POLLING_MAX_RETRIES,
  } = options;

  const [operationRecords, setOperationRecords] = useState<
    Record<string, AssetsUploadOperationRecord>
  >({});

  const uploadingOperationIds = useMemo(
    () =>
      Object.values(operationRecords)
        .filter((record) => record.phase === 'upload')
        .map((record) => record.operationId),
    [operationRecords],
  );

  const moderatingOperations = useMemo(
    () =>
      Object.values(operationRecords)
        .filter(shouldPollModeration)
        .map((record) => ({
          operationId: record.operationId,
          assetId: record.assetId,
        })),
    [operationRecords],
  );

  const moderatingOperationIds = useMemo(
    () => moderatingOperations.map(({ operationId }) => operationId),
    [moderatingOperations],
  );

  const uploadOperationQueries = useMemo(() => {
    return uploadingOperationIds.map((operationId): UseQueryOptions<Operation | undefined> => {
      const uploadPollAttempts = operationRecords[operationId]?.uploadPollAttempts ?? 0;

      return {
        queryKey: getAssetsUploadOperationStatusQueryKey(operationId),
        queryFn: async () => {
          try {
            const operation = await assetsUploadApiClient.getOperationStatus(operationId);
            setOperationRecords((previousRecords) =>
              applyUploadQueryResultTransition(
                previousRecords,
                operationId,
                operation,
                uploadPollingMaxRetries,
              ),
            );
            return operation;
          } catch (error) {
            setOperationRecords((previousRecords) =>
              applyUploadQueryErrorTransition(
                previousRecords,
                operationId,
                error instanceof Error ? error.message : 'Upload polling failed',
              ),
            );
            throw error;
          }
        },
        enabled: uploadPollAttempts <= uploadPollingMaxRetries,
        refetchInterval: (query) => {
          if (uploadPollAttempts >= uploadPollingMaxRetries) {
            return false;
          }

          const operation = query.state.data;
          if (query.state.status === 'error') {
            return false;
          }

          if (operation?.done) {
            return false;
          }

          return uploadPollingIntervalMs;
        },
      };
    });
  }, [operationRecords, uploadPollingIntervalMs, uploadPollingMaxRetries, uploadingOperationIds]);

  const moderationQueries = useMemo(() => {
    return moderatingOperations.map(
      ({ operationId, assetId }): UseQueryOptions<ModerationState> => {
        const moderationPollAttempts = operationRecords[operationId]?.moderationPollAttempts ?? 0;

        return {
          queryKey: getAssetsUploadModerationStatusQueryKey(operationId, assetId),
          queryFn: async () => {
            try {
              const moderationState = await getAssetModerationState(assetId);
              setOperationRecords((previousRecords) =>
                applyModerationQueryResultTransition(
                  previousRecords,
                  operationId,
                  moderationState,
                  moderationPollingMaxRetries,
                ),
              );
              return moderationState;
            } catch (error) {
              setOperationRecords((previousRecords) =>
                applyModerationQueryErrorTransition(previousRecords, operationId),
              );
              throw error;
            }
          },
          enabled: moderationPollAttempts <= moderationPollingMaxRetries,
          refetchInterval: (query) => {
            if (moderationPollAttempts >= moderationPollingMaxRetries) {
              return false;
            }

            const moderationState = query.state.data;
            if (query.state.status === 'error') {
              return false;
            }

            if (moderationState != null && isTerminalModerationState(moderationState)) {
              return false;
            }

            return moderationPollingIntervalMs;
          },
        };
      },
    );
  }, [
    moderatingOperations,
    moderationPollingIntervalMs,
    moderationPollingMaxRetries,
    operationRecords,
  ]);

  useQueries({ queries: uploadOperationQueries });
  useQueries({ queries: moderationQueries });

  const addOperationId = useCallback((operationId: string) => {
    setOperationRecords((previousRecords) => {
      if (previousRecords[operationId] != null) {
        return previousRecords;
      }

      return {
        ...previousRecords,
        [operationId]: {
          operationId,
          phase: 'upload',
          uploadStatus: 'pending',
          uploadPollAttempts: 0,
          moderationPollAttempts: 0,
        },
      };
    });
  }, []);

  const getUploadStatus = useCallback(
    (operationId: string): AssetsUploadOperationStatusDetails => {
      const record = operationRecords[operationId];
      if (!record) {
        return { status: AssetsUploadOperationStatus.Unknown };
      }

      return buildUploadStatusDetails(record);
    },
    [operationRecords],
  );

  return useMemo(
    () => ({
      addOperationId,
      getUploadStatus,
      uploadingOperationIds,
      moderatingOperationIds,
    }),
    [addOperationId, getUploadStatus, moderatingOperationIds, uploadingOperationIds],
  );
};

export default useAssetsUploadOperationStatusPolling;

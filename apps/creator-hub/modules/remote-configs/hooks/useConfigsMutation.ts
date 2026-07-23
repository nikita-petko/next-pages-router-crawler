import { useState, useCallback, useRef, useEffect } from 'react';
import type { TPendingTranslationFunction } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import isUploadErrorDueToAlreadyPublishing from '../api/isUploadErrorDueToAlreadyPublishing';
import { ErrorType } from '../api/universeConfigsClientEnums';
import type { ValidConfigChangeResult, ValidCustomError } from '../api/validTypes';

export type ConfigActionErrorType =
  | ErrorType.CreateKeyHasOverride
  | ErrorType.ReachedMaxEntries
  | ErrorType.ConfigLockedByExperiment
  | ErrorType.DraftMismatch
  | ErrorType.UpdateFailed
  | ErrorType.DeploymentInProgress
  | 'unknown';

const defaultConfigActionErrorMessages: Record<ConfigActionErrorType, string> = {
  [ErrorType.CreateKeyHasOverride]: 'Key already exists in draft',
  [ErrorType.ReachedMaxEntries]: 'Reached max entries',
  [ErrorType.ConfigLockedByExperiment]: 'Config locked by experiment',
  [ErrorType.DraftMismatch]: 'Draft mismatch',
  [ErrorType.UpdateFailed]: 'Update failed',
  [ErrorType.DeploymentInProgress]: 'Change during publish',
  unknown: 'Unknown error',
};

export class ConfigActionError extends Error {
  public readonly type: ConfigActionErrorType;

  public readonly apiErrorMessage?: string;

  private static readonly typeByApiErrorCode: Partial<Record<ErrorType, ConfigActionErrorType>> = {
    [ErrorType.CreateKeyHasOverride]: ErrorType.CreateKeyHasOverride,
    [ErrorType.ReachedMaxEntries]: ErrorType.ReachedMaxEntries,
    [ErrorType.ConfigLockedByExperiment]: ErrorType.ConfigLockedByExperiment,
    [ErrorType.DraftMismatch]: ErrorType.DraftMismatch,
    [ErrorType.UpdateFailed]: ErrorType.UpdateFailed,
    // Treat missing targets as update failures in client UX.
    [ErrorType.OverrideNotFound]: ErrorType.UpdateFailed,
    [ErrorType.DeploymentInProgress]: ErrorType.DeploymentInProgress,
  };

  public static fromApiError({ errorCode, message: apiErrorMessage }: ValidCustomError) {
    const type = ConfigActionError.typeByApiErrorCode[errorCode] ?? 'unknown';
    if (type === 'unknown') {
      return new ConfigActionError({
        message: `Error mutating config: ${errorCode}`,
        type,
        apiErrorMessage,
      });
    }

    return new ConfigActionError({
      type,
      apiErrorMessage,
    });
  }

  private static readonly conditionUpdateBlockedByStagedChangesMessage =
    'Cannot update condition when there are already staged changes. Please discard or publish staged changes before updating a condition.';

  private static readonly conditionDeleteOrRenameBlockedByStagedChangesMessage =
    'Cannot delete or rename a published condition while there are staged changes. Please discard or publish staged changes before performing this operation.';

  private static isConditionUpdateBlockedByStagedChanges(apiErrorMessage?: string): boolean {
    return apiErrorMessage === ConfigActionError.conditionUpdateBlockedByStagedChangesMessage;
  }

  private static isConditionDeleteOrRenameBlockedByStagedChanges(
    apiErrorMessage?: string,
  ): boolean {
    return (
      apiErrorMessage === ConfigActionError.conditionDeleteOrRenameBlockedByStagedChangesMessage
    );
  }

  public getTranslatedErrorMessage(tPendingTranslation: TPendingTranslationFunction): string {
    switch (this.type) {
      case ErrorType.UpdateFailed:
        if (ConfigActionError.isConditionUpdateBlockedByStagedChanges(this.apiErrorMessage)) {
          return tPendingTranslation(
            'Cannot update condition when there are already staged changes. Please discard or publish staged changes before updating a condition.',
            'Error shown when editing a condition is blocked because staged changes already exist.',
            translationKey(
              'Error.UpdateConditionWithStagedChanges',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          );
        }
        if (
          ConfigActionError.isConditionDeleteOrRenameBlockedByStagedChanges(this.apiErrorMessage)
        ) {
          return tPendingTranslation(
            'Cannot delete or rename a published condition while there are staged changes. Please discard or publish staged changes before performing this operation.',
            'Error shown when deleting or renaming a published condition is blocked because staged changes already exist.',
            translationKey(
              'Error.DeleteOrRenameConditionWithStagedChanges',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          );
        }
        return tPendingTranslation(
          'Update failed',
          'Generic error shown when a remote config update fails.',
          translationKey(
            'Error.UpdateFailed',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        );
      case ErrorType.DraftMismatch:
        return tPendingTranslation(
          'You were viewing an out of date set of staged configs. Please check the updated staged configs table and try again.',
          'Error shown when a remote config draft has changed and the user needs to refresh before retrying.',
          translationKey(
            'Error.DraftMismatch',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        );
      case ErrorType.ReachedMaxEntries:
        return tPendingTranslation(
          'Maximum number of configs overrides ({maxEntries}) reached',
          'Error shown when the user cannot create more remote config entries because the maximum entry count was reached.',
          translationKey(
            'Error.ReachedMaxEntries',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
          {
            maxEntries: '1000',
          },
        );
      case ErrorType.DeploymentInProgress:
        return tPendingTranslation(
          'Please wait for ongoing publish to complete',
          'Error shown when the user tries to change remote configs while staged changes are being published.',
          translationKey(
            'Error.UpdateDuringPublishing',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        );
      case ErrorType.CreateKeyHasOverride:
        return tPendingTranslation(
          'Key already exists in draft',
          'Error shown when the user tries to create a remote config key that already exists in the draft.',
          translationKey(
            'Error.CreateKeyHasOverride',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        );
      case ErrorType.ConfigLockedByExperiment:
        return tPendingTranslation(
          'Config used by a scheduled or running experiment',
          'Error shown when a remote config cannot be edited because it is locked by an experiment.',
          translationKey(
            'Error.ConfigLockedByExperiment',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        );
      case 'unknown':
        return tPendingTranslation(
          'Unknown Error',
          'Generic error shown when a remote config operation fails for an unknown reason.',
          translationKey('Error.Unknown', TranslationNamespace.UniverseConfigAndExperimentation),
        );
      default: {
        const exhaustiveCheck: never = this.type;
        throw new Error(`Unhandled error type: ${String(exhaustiveCheck)}`);
      }
    }
  }

  constructor({
    message,
    type,
    apiErrorMessage,
  }: {
    message?: string;
    type: ConfigActionErrorType;
    apiErrorMessage?: string;
  }) {
    super(message ?? defaultConfigActionErrorMessages[type]);
    this.type = type;
    this.apiErrorMessage = apiErrorMessage;
  }
}

// Types remain the same
type MutationFunction<TVariables> = (variables: TVariables) => Promise<ValidConfigChangeResult>;

type TData = { draftHash?: string };

export type MutateOptions = {
  onSuccess?: (data: TData) => void;
  onError?: (error: ConfigActionError) => void;
};

type UseConfigsMutationResult<TVariables> = {
  mutate: (variables: TVariables, options?: MutateOptions) => Promise<void>;
  data: TData | null;
  error: ConfigActionError | null;
  isPending: boolean;
  clearError: () => void;
};

/**
 * Tracks the latest mutation using a mutation ID to ensure that
 * `data` and `error` always correspond to the most recent `mutate`
 * call. This prevents race conditions where slower, older requests
 * might overwrite the results of newer ones.
 *
 * For each call to `mutate`, you can provide `MutateOptions` with
 * `onSuccess` and `onError` callbacks. These callbacks are invoked
 * for every mutation, regardless of order or overlap. However, the
 * hook's `data` and `error` state will always reflect only the
 * latest mutation attempt.
 *
 * @param mutationFn The async function to perform the mutation.
 * @returns An object with `mutate`, `data`, `error`, `isPending`,
 *   and `clearError`.
 */
const useConfigsMutation = <TVariables>(
  mutationFn: MutationFunction<TVariables>,
): UseConfigsMutationResult<TVariables> => {
  const [isPending, setIsPending] = useState(false);
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<ConfigActionError | null>(null);

  const mutationFnRef = useRef(mutationFn);
  useEffect(() => {
    mutationFnRef.current = mutationFn;
  }, [mutationFn]);

  // *** 1. Ref to track if the component is mounted ***
  const isMountedRef = useRef(true);
  // *** 2. Set the ref to false when the component unmounts ***
  useEffect(() => {
    isMountedRef.current = true; // Set on mount/re-render
    return () => {
      isMountedRef.current = false; // Cleanup sets it to false
    };
  }, []);

  const mutationIdRef = useRef(0);
  const shouldUpdateResult = useCallback((mutationId: number) => {
    return isMountedRef.current && mutationId === mutationIdRef.current;
  }, []);

  const mutate: UseConfigsMutationResult<TVariables>['mutate'] = useCallback(
    async (variables: TVariables, options?: MutateOptions) => {
      mutationIdRef.current += 1;
      const currentMutationId = mutationIdRef.current;

      // *** 3. Check if mounted before starting ***
      if (!isMountedRef.current) {
        return;
      }

      setIsPending(true);
      setData(null);
      setError(null);

      try {
        const result = await mutationFnRef.current(variables);

        // *** 4. Guard all state updates with the mounted check ***
        if (shouldUpdateResult(currentMutationId)) {
          if (result.isError) {
            throw ConfigActionError.fromApiError(result.error);
          }
          setData(result.data);
          options?.onSuccess?.(result.data);
        }
      } catch (err) {
        if (!shouldUpdateResult(currentMutationId)) {
          return;
        }

        let validError: ConfigActionError;
        if (err instanceof ConfigActionError) {
          validError = err;
        } else if (await isUploadErrorDueToAlreadyPublishing(err)) {
          validError = new ConfigActionError({
            type: ErrorType.DeploymentInProgress,
          });
        } else {
          validError = new ConfigActionError({
            message: `Unknown error: ${err instanceof Error ? err.message : String(err)}`,
            type: 'unknown',
          });
        }
        setError(validError);
        options?.onError?.(validError);
      } finally {
        if (shouldUpdateResult(currentMutationId)) {
          setIsPending(false);
        }
      }
    },
    [shouldUpdateResult],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { mutate, data, error, isPending, clearError };
};

export default useConfigsMutation;

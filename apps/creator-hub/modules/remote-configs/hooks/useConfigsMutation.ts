import { useState, useCallback, useRef, useEffect } from 'react';
import { ErrorType } from '../api/universeConfigsClientEnums';
import { ValidConfigChangeResult } from '../api/validTypes';
import isUploadErrorDueToAlreadyPublishing from '../api/isUploadErrorDueToAlreadyPublishing';

export type ConfigActionErrorType =
  | ErrorType.CreateKeyHasOverride
  | ErrorType.ReachedMaxEntries
  | ErrorType.ConfigLockedByExperiment
  | ErrorType.DraftMismatch
  | ErrorType.UpdateFailed
  | 'change-during-publish'
  | 'unknown';

export class ConfigActionError extends Error {
  public readonly type: ConfigActionErrorType;

  constructor({ message, type }: { message: string; type: ConfigActionErrorType }) {
    super(message);
    this.type = type;
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
      if (!isMountedRef.current) return;

      setIsPending(true);
      setData(null);
      setError(null);

      try {
        const result = await mutationFnRef.current(variables);

        // *** 4. Guard all state updates with the mounted check ***
        if (shouldUpdateResult(currentMutationId)) {
          if (result.isError) {
            const { errorCode } = result.error;
            switch (errorCode) {
              case ErrorType.CreateKeyHasOverride as const:
                throw new ConfigActionError({
                  message: 'Key already exists in draft',
                  type: ErrorType.CreateKeyHasOverride,
                });
              case ErrorType.ReachedMaxEntries as const:
                throw new ConfigActionError({
                  message: 'Reached max entries',
                  type: ErrorType.ReachedMaxEntries,
                });
              case ErrorType.ConfigLockedByExperiment as const:
                throw new ConfigActionError({
                  message: 'Config locked by experiment',
                  type: ErrorType.ConfigLockedByExperiment,
                });
              case ErrorType.DraftMismatch as const:
                throw new ConfigActionError({
                  message: 'Draft mismatch',
                  type: ErrorType.DraftMismatch,
                });
              case ErrorType.UpdateFailed as const:
                throw new ConfigActionError({
                  message: 'Update failed',
                  type: ErrorType.UpdateFailed,
                });
              // TODO(gperkins@2025-03-27): Add error for "rejected due to someone else publishing" (DSA-4107)
              // not exhaustive
              default:
                // GOTO handleFailure
                throw new ConfigActionError({
                  message: `Error mutating config: ${errorCode}`,
                  type: 'unknown',
                });
            }
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
            message: 'Change during publish',
            type: 'change-during-publish',
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

import { FC, PropsWithChildren, useCallback, useContext, useMemo } from 'react';
import { useQueries, UseQueryResult } from '@tanstack/react-query';
import { getResponseFromError } from '@modules/clients/utils';
import { StatusCodes } from '@rbx/core';
import { useRouter } from 'next/router';
import { useAuthentication } from '@modules/authentication/providers';
import FeatureFlagsContext from './FeatureFlagsContext';
import { FeatureFlagNamespace, FeatureFlagsByNamespace } from '../namespaces';
import { type EvaluationContext, type IdType, type TFlag } from '../types';
import useIsEmployee from '../useIsEmployee';
import useLocalFlagOverrides from '../floating-widget/localOverride';

const FEATURE_FLAGS_QUERY_KEY_PREFIX = 'get-feature-flags';

type NamespacedFlagsResult = {
  namespace: FeatureFlagNamespace;
  flags: Partial<Record<TFlag<FeatureFlagNamespace>, boolean>>;
};

type FeatureFlagsProviderProps = PropsWithChildren<{
  namespaces: FeatureFlagNamespace[];
  /**
   * Optional evaluation context for feature flag evaluation.
   * Provide explicit IDs (e.g., universeId) when needed.
   * Flag fetching is automatically deferred until all provided ID fields
   * have defined values, preventing partial results when the context
   * depends on async data.
   */
  evaluationContext?: EvaluationContext;
}>;

/**
 * Core feature flags provider that manages flag fetching and caching.
 * For pages where the router query 'id' param should be used as an evaluation ID,
 * use QueryBasedFeatureFlagsProvider instead.
 */
const emptyEvaluationContext: EvaluationContext = {};
export const FeatureFlagsProvider: FC<FeatureFlagsProviderProps> = ({
  children,
  namespaces,
  evaluationContext = emptyEvaluationContext,
}) => {
  const isEvaluationContextReady = Object.values(evaluationContext).every((value) => !!value);

  const router = useRouter();
  const { user } = useAuthentication();

  // Stable key for memoization without JSON serialization
  const namespacesKey = useMemo(() => [...namespaces].sort().join(','), [namespaces]);

  const userId = user?.id ?? 0;

  const flagsFromExistingScope = useContext(FeatureFlagsContext);

  const retryOnFailure = useCallback((failureCount: number, error: Error) => {
    return failureCount < 3 && getResponseFromError(error)?.status !== StatusCodes.FORBIDDEN;
  }, []);

  const combine = useCallback(
    (results: UseQueryResult<NamespacedFlagsResult, Error>[]) => {
      // Start with inherited flags from parent provider, then initialize all
      // requested namespaces with empty defaults
      const initialState = (namespacesKey.split(',') as FeatureFlagNamespace[]).reduce(
        (acc, ns) => {
          if (ns) {
            acc[ns] = { flags: {}, isFetched: false };
          }
          return acc;
        },
        { ...flagsFromExistingScope },
      );

      // Populate with actual results - using namespace from data, not index
      return results.reduce((acc, { data, isFetched }) => {
        if (data) {
          acc[data.namespace] = {
            flags: data.flags,
            isFetched,
          };
        }
        return acc;
      }, initialState);
    },
    [namespacesKey, flagsFromExistingScope],
  );

  const flagsQueriesByNamespace = useQueries({
    queries: namespaces.map((namespace) => ({
      queryKey: [FEATURE_FLAGS_QUERY_KEY_PREFIX, namespace, evaluationContext, userId] as const,
      queryFn: async (): Promise<NamespacedFlagsResult> => ({
        namespace,
        flags: await FeatureFlagsByNamespace[namespace].client.fetchFlags({
          ...evaluationContext,
          userId,
        }),
      }),
      staleTime: Infinity,
      retry: retryOnFailure,
      enabled: router.isReady && !!userId && isEvaluationContextReady,
    })),
    combine,
  });

  return (
    <FeatureFlagsContext.Provider value={flagsQueriesByNamespace}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

// Overload for single flag
export function useFeatureFlagsForNamespace<TNamespace extends FeatureFlagNamespace>(
  flag: TFlag<TNamespace>,
  namespace: TNamespace,
): Record<TFlag<TNamespace>, boolean> & { isFetched: boolean };

// Overload for array of flags
export function useFeatureFlagsForNamespace<TNamespace extends FeatureFlagNamespace>(
  flags: readonly TFlag<TNamespace>[],
  namespace: TNamespace,
): Record<TFlag<TNamespace>, boolean> & { isFetched: boolean };

// Implementation
export function useFeatureFlagsForNamespace<TNamespace extends FeatureFlagNamespace>(
  flags: TFlag<TNamespace> | readonly TFlag<TNamespace>[],
  namespace: TNamespace,
): Record<string, boolean> & { isFetched: boolean } {
  const featureFlagsContext = useContext(FeatureFlagsContext) ?? {};
  const flagsForNamespace = featureFlagsContext[namespace];

  // We need to serialize and deserialize the flags to avoid function recreation
  const serializedFlags = useMemo(
    () => (Array.isArray(flags) ? JSON.stringify([...flags].sort()) : JSON.stringify([flags])),
    [flags],
  );
  const deSerializedFlags = useMemo(() => {
    const parsedFlags = JSON.parse(serializedFlags);
    return Array.isArray(parsedFlags)
      ? (parsedFlags as readonly TFlag<TNamespace>[])
      : [parsedFlags as TFlag<TNamespace>];
  }, [serializedFlags]);

  const isEmployee = useIsEmployee();
  const { localFlagOverrides } = useLocalFlagOverrides();

  // Throw outside useMemo: throwing inside the useMemo callback breaks React 19's updateMemo when
  // the namespace is missing (internal null dereference while handling the thrown error).
  if (!flagsForNamespace || flagsForNamespace.flags == null) {
    throw new Error(
      `Flags for namespace ${namespace} not found, did you forget to add it to the nearest FeatureFlagsProvider?`,
    );
  }

  return useMemo(() => {
    const result: Record<string, boolean> & { isFetched: boolean } = {
      isFetched: flagsForNamespace.isFetched,
    };
    deSerializedFlags.forEach((flag: TFlag<TNamespace>) => {
      result[flag] =
        (isEmployee ? localFlagOverrides[namespace]?.flags?.[flag] : undefined) ??
        flagsForNamespace.flags[flag] ??
        false;
    });

    return result;
  }, [flagsForNamespace, deSerializedFlags, namespace, isEmployee, localFlagOverrides]);
}

type QueryBasedFeatureFlagsProviderProps = PropsWithChildren<{
  namespaces: FeatureFlagNamespace[];
  /**
   * Specifies which EvaluationContext field the router query 'id' param should be assigned to.
   * For example, 'universeId' for experience pages where id represents a universe.
   */
  idType: IdType;
}>;

/**
 * Convenience wrapper around FeatureFlagsProvider that extracts the 'id' param
 * from the router query and assigns it to the specified EvaluationContext field.
 *
 * Use this on pages where the URL contains an [id] param that should be used
 * for feature flag evaluation.
 *
 * @example
 * // For experience pages where [id] is a universeId:
 * <QueryBasedFeatureFlagsProvider namespaces={[FeatureFlagNamespace.Analytics]} idType="universeId">
 *   {children}
 * </QueryBasedFeatureFlagsProvider>
 */
export const QueryBasedFeatureFlagsProvider: FC<QueryBasedFeatureFlagsProviderProps> = ({
  children,
  namespaces,
  idType,
}) => {
  const router = useRouter();

  const evaluationContext: EvaluationContext = useMemo(() => {
    const { id } = router.query;
    if (typeof id === 'undefined' || Array.isArray(id)) {
      return {};
    }
    const parsedId = parseInt(id, 10);
    if (Number.isNaN(parsedId)) {
      return {};
    }
    return { [idType]: parsedId };
  }, [router.query, idType]);

  return (
    <FeatureFlagsProvider namespaces={namespaces} evaluationContext={evaluationContext}>
      {children}
    </FeatureFlagsProvider>
  );
};

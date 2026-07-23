import { useMutation, type UseMutationOptions, type QueryClient } from '@tanstack/react-query';
import {
  GamePassProperty,
  type GamePassBulkUpdateResponse,
  type GamePassConfigV2,
  type GamePassUpdateError,
} from '@rbx/client-game-passes-http-service/v1';
import passesClient, { type BatchGetGamePassConfigsResponse } from '@modules/clients/passes';
import {
  executeBatchedUpdates,
  type BatchExecutionConfig,
  type BatchUpdateResult,
} from '@modules/monetization-shared/batch-updates';
import type { RetryOptions } from '@modules/monetization-shared/retry';
import { hasRegionalPricingEnabled } from '../utils/passesUtils';
import {
  gamePassKeys,
  matchesGamePassBatchConfigsQuery,
  matchesGamePassListAllQuery,
  MAX_WRITE_LIMIT,
} from './constants';

type Options = Omit<
  UseMutationOptions<BatchUpdateResult<GamePassUpdateError>, Error, MutationVariables>,
  'mutationFn'
> & {
  onPartialFailure?: (
    errors: NonNullable<GamePassBulkUpdateResponse['errors']>,
    variables: MutationVariables,
  ) => void;
  batchRetry?: RetryOptions['retry'];
  batchRetryDelay?: RetryOptions['retryDelay'];
};

type UseBulkUpdateGamePassesParams = {
  universeId: number;
  /** Maximum number of passes to update in a single batch. Cannot exceed {@link MAX_WRITE_LIMIT}. */
  batchLimit?: BatchExecutionConfig['batchLimit'];
} & Omit<BatchExecutionConfig, 'batchLimit' | 'totalLimit'>;

type MutationVariables = {
  passIds: number[];
  enabled: boolean;
};

/** Default retries for attempted update. Not the same as retries for a single batch call. */
const DEFAULT_RETRIES = 1;

/** Default batch limit for a single batch call */
const DEFAULT_BATCH_LIMIT = 30;

/**
 * Updates the regional pricing status for a list of game passes.
 *
 * Delegates to {@link executeBatchedUpdates} for batching, retries, and error aggregation.
 */
export async function bulkUpdateRegionalPricingForPasses({
  universeId,
  passIds,
  enabled,
  batchLimit = DEFAULT_BATCH_LIMIT,
  ...batchOptions
}: UseBulkUpdateGamePassesParams & MutationVariables) {
  const updates = passIds.map((passId) => ({
    gamePassId: passId,
    changedPropertyNames: [GamePassProperty.RegionalPricing],
    changedProperties: {
      regionalPricing: enabled,
    },
  }));

  return executeBatchedUpdates(
    updates,
    {
      executeBatch: (chunk) =>
        passesClient.batchUpdateGamePasses({
          universeId,
          gamePassesBulkUpdateRequest: {
            gamePassUpdates: chunk,
          },
        }),
      getPartialErrors: (response) => response.errors ?? [],
      createBatchFailureError: (update, reason): GamePassUpdateError => ({
        gamePassId: update.gamePassId,
        error: {
          errorMessage: reason instanceof Error ? reason.message : 'Unknown error',
        },
      }),
    },
    { batchLimit, ...batchOptions },
  );
}

/**
 * Toggles the `RegionalPricing` feature flag on a single game pass config.
 * Returns the same reference if nothing changed (no `priceInformation`).
 */
export function setPassRegionalPricing(
  pass: Readonly<GamePassConfigV2>,
  enabled: boolean,
): GamePassConfigV2 {
  // Note: price information must exist to set regional pricing, this just exists as a defensive check
  if (!pass.priceInformation) {
    return pass;
  }

  const features = pass.priceInformation.enabledFeatures;

  let updatedFeatures: typeof features;
  if (enabled) {
    updatedFeatures = features.includes('RegionalPricing')
      ? features
      : [...features, 'RegionalPricing'];
  } else {
    updatedFeatures = features.filter((f) => f !== 'RegionalPricing');
  }

  return {
    ...pass,
    priceInformation: {
      ...pass.priceInformation,
      enabledFeatures: updatedFeatures,
    },
  };
}

/**
 * Updater function for updating query cache data for the game passes
 * list query. Used for optimistic updates.
 *
 * If no changes were made, returns old data to not force unnecessary re-renders
 */
export function updatePassesQueryData(params: {
  oldData: GamePassConfigV2[] | undefined;
  updatedPassIds: Set<number>;
  enabled: boolean;
}): GamePassConfigV2[] | undefined {
  const { oldData, updatedPassIds, enabled } = params;
  if (!oldData) {
    return undefined;
  }

  if (updatedPassIds.size === 0) {
    return oldData;
  }

  let hasUpdates = false;
  const updatedData = oldData.map((pass) => {
    if (!updatedPassIds.has(pass.gamePassId)) {
      return pass;
    }

    if (hasRegionalPricingEnabled(pass) === enabled) {
      return pass;
    }

    hasUpdates = true;
    return setPassRegionalPricing(pass, enabled);
  });

  if (!hasUpdates) {
    return oldData;
  }

  return updatedData;
}

/**
 * Updater for batch-get game pass query caches (`gamePassKeys.batchConfigs`).
 * Toggles the `RegionalPricing` feature flag for matching passes.
 */
export function updateBatchGetGamePassesQueryData(params: {
  oldData: BatchGetGamePassConfigsResponse | undefined;
  updatedPassIds: Set<number>;
  enabled: boolean;
}): BatchGetGamePassConfigsResponse | undefined {
  const { oldData, updatedPassIds, enabled } = params;
  if (!oldData?.gamePasses) {
    return oldData;
  }

  if (updatedPassIds.size === 0) {
    return oldData;
  }

  let hasUpdates = false;
  const updatedPasses = oldData.gamePasses.map((pass) => {
    if (!updatedPassIds.has(pass.gamePassId)) {
      return pass;
    }
    if (hasRegionalPricingEnabled(pass) === enabled) {
      return pass;
    }
    const updated = setPassRegionalPricing(pass, enabled);
    if (updated !== pass) {
      hasUpdates = true;
    }
    return updated;
  });

  if (!hasUpdates) {
    return oldData;
  }

  return { ...oldData, gamePasses: updatedPasses };
}

/**
 * Updater for individual game pass config query caches (`gamePassKeys.config`).
 */
export function updateGamePassConfigQueryData(params: {
  oldData: GamePassConfigV2 | undefined;
  enabled: boolean;
}): GamePassConfigV2 | undefined {
  const { oldData, enabled } = params;
  if (!oldData) {
    return undefined;
  }
  if (hasRegionalPricingEnabled(oldData) === enabled) {
    return oldData;
  }
  return setPassRegionalPricing(oldData, enabled);
}

/**
 * High-level cache writer: updates all game pass cache layers
 * (list, batch-get, individual config) for the given pass IDs.
 */
export function setGamePassRegionalPricingCaches(params: {
  queryClient: QueryClient;
  universeId: number;
  updatedPassIds: Set<number>;
  enabled: boolean;
}): void {
  const { queryClient, universeId, updatedPassIds, enabled } = params;

  // TODO(@jeminpark): update to refine this onto a specified query limit (pageSize)
  queryClient.setQueriesData<GamePassConfigV2[]>(
    { predicate: (query) => matchesGamePassListAllQuery(query, universeId) },
    (oldData) =>
      updatePassesQueryData({
        oldData,
        updatedPassIds,
        enabled,
      }),
  );

  queryClient.setQueriesData<BatchGetGamePassConfigsResponse>(
    { predicate: (query) => matchesGamePassBatchConfigsQuery(query, universeId) },
    (oldData) =>
      updateBatchGetGamePassesQueryData({
        oldData,
        updatedPassIds,
        enabled,
      }),
  );

  updatedPassIds.forEach((passId) => {
    queryClient.setQueryData<GamePassConfigV2>(gamePassKeys.config(universeId, passId), (oldData) =>
      updateGamePassConfigQueryData({
        oldData,
        enabled,
      }),
    );
  });
}

export function useBulkUpdateRegionalPricingForPasses(
  { universeId, ...batchParams }: UseBulkUpdateGamePassesParams,
  { onSuccess, onPartialFailure, batchRetry, batchRetryDelay, ...options }: Options = {},
) {
  if (batchParams.batchLimit && batchParams.batchLimit > MAX_WRITE_LIMIT) {
    throw new Error(`Batch limit cannot exceed ${MAX_WRITE_LIMIT}.`);
  }

  return useMutation({
    mutationKey: gamePassKeys.batchUpdate(universeId),
    mutationFn: (variables: MutationVariables) =>
      bulkUpdateRegionalPricingForPasses({
        universeId,
        ...batchParams,
        ...variables,
        retry: batchRetry,
        retryDelay: batchRetryDelay,
      }),
    onSuccess: (response, variables, onSuccessResult, context) => {
      const updatedPassIds = new Set(variables.passIds);

      const isPartialFailure = !!response.errors?.length;
      if (isPartialFailure) {
        onPartialFailure?.(response.errors, variables);
        response.errors.forEach((error) => updatedPassIds.delete(error.gamePassId));
      }

      // Psuedo-optimistically update the cache for the game passes list
      // - else it'll take a while to reload with fresh data, especially on later pages.
      // TODO: consider moving this to `onMutate` for true optimistic UX if necessary.
      setGamePassRegionalPricingCaches({
        queryClient: context.client,
        universeId,
        updatedPassIds,
        enabled: variables.enabled,
      });

      void context.client.invalidateQueries({ queryKey: gamePassKeys.all(universeId) });

      onSuccess?.(response, variables, onSuccessResult, context);
    },
    retry: DEFAULT_RETRIES,
    ...options,
  });
}

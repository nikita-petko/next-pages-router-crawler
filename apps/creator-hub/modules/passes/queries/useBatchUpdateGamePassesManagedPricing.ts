/* istanbul ignore file */
import { useMutation, type UseMutationOptions, type QueryClient } from '@tanstack/react-query';
import {
  GamePassProperty,
  type GamePassBulkUpdateResponse,
  type GamePassConfigV2,
  type GamePassUpdateError,
} from '@rbx/client-game-passes-http-service/v1';
import passesClient, { type BatchGetGamePassConfigsResponse } from '@modules/clients/passes';
import { executeBatchedUpdates } from '@modules/monetization-shared/batch-updates';
import { useMonetizationFlags } from '@modules/monetization-shared/flags/useMonetizationFlags';
import { hasManagedPricingEnabled } from '../utils/passesUtils';
import {
  gamePassKeys,
  matchesGamePassBatchConfigsQuery,
  matchesGamePassListAllQuery,
} from './constants';

type MutationVariables = {
  passIds: number[];
  enabled: boolean;
};

type Options = Omit<
  UseMutationOptions<GamePassBulkUpdateResponse, Error, MutationVariables>,
  'mutationFn'
> & {
  onPartialFailure?: (
    errors: NonNullable<GamePassBulkUpdateResponse['errors']>,
    variables: MutationVariables,
  ) => void;
};

const DEFAULT_BATCH_LIMIT = 30;

async function bulkUpdateManagedPricingForPasses({
  universeId,
  passIds,
  enabled,
}: {
  universeId: number;
  passIds: number[];
  enabled: boolean;
}): Promise<GamePassBulkUpdateResponse> {
  const updates = passIds.map((gamePassId) => ({
    gamePassId,
    changedPropertyNames: [GamePassProperty.ManagedPricing],
    changedProperties: {
      managedPricing: enabled,
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
    { batchLimit: DEFAULT_BATCH_LIMIT },
  );
}

function setPassManagedPricing(
  pass: Readonly<GamePassConfigV2>,
  enabled: boolean,
): GamePassConfigV2 {
  if (hasManagedPricingEnabled(pass) === enabled) {
    return pass;
  }
  return { ...pass, isManagedPricingEnabled: enabled };
}

export function updatePassesManagedPricingQueryData(params: {
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
    const updated = setPassManagedPricing(pass, enabled);
    if (updated !== pass) {
      hasUpdates = true;
    }
    return updated;
  });

  return hasUpdates ? updatedData : oldData;
}

export function updateBatchGetGamePassesManagedPricingQueryData(params: {
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
    const updated = setPassManagedPricing(pass, enabled);
    if (updated !== pass) {
      hasUpdates = true;
    }
    return updated;
  });

  return hasUpdates ? { ...oldData, gamePasses: updatedPasses } : oldData;
}

export function updateGamePassConfigManagedPricingQueryData(params: {
  oldData: GamePassConfigV2 | undefined;
  enabled: boolean;
}): GamePassConfigV2 | undefined {
  const { oldData, enabled } = params;
  if (!oldData) {
    return undefined;
  }
  return setPassManagedPricing(oldData, enabled);
}

/**
 * High-level cache writer: updates all game pass cache layers
 * (list, batch-get, individual config) for the given pass IDs.
 */
export function setGamePassManagedPricingCaches(params: {
  queryClient: QueryClient;
  universeId: number;
  updatedPassIds: Set<number>;
  enabled: boolean;
}): void {
  const { queryClient, universeId, updatedPassIds, enabled } = params;

  queryClient.setQueriesData<GamePassConfigV2[]>(
    { predicate: (query) => matchesGamePassListAllQuery(query, universeId) },
    (oldData) =>
      updatePassesManagedPricingQueryData({
        oldData,
        updatedPassIds,
        enabled,
      }),
  );

  queryClient.setQueriesData<BatchGetGamePassConfigsResponse>(
    { predicate: (query) => matchesGamePassBatchConfigsQuery(query, universeId) },
    (oldData) =>
      updateBatchGetGamePassesManagedPricingQueryData({
        oldData,
        updatedPassIds,
        enabled,
      }),
  );

  updatedPassIds.forEach((passId) => {
    queryClient.setQueryData<GamePassConfigV2>(gamePassKeys.config(universeId, passId), (oldData) =>
      updateGamePassConfigManagedPricingQueryData({
        oldData,
        enabled,
      }),
    );
  });
}

/**
 * Batch-updates the managed pricing status for game passes.
 */
export function useBatchUpdateGamePassesManagedPricing(
  { universeId }: { universeId: number },
  { onSuccess, onPartialFailure, ...options }: Options = {},
) {
  const { mockManagedPricingProductWrites } = useMonetizationFlags(
    'mockManagedPricingProductWrites',
  );

  return useMutation({
    mutationKey: gamePassKeys.batchUpdate(universeId),
    mutationFn: async ({ passIds, enabled }): Promise<GamePassBulkUpdateResponse> => {
      if (mockManagedPricingProductWrites ?? false) {
        await new Promise((resolve) => {
          setTimeout(resolve, 1000);
        });
        return { errors: [] };
      }

      return bulkUpdateManagedPricingForPasses({ universeId, passIds, enabled });
    },
    onSuccess: (response, variables, onSuccessResult, context) => {
      const updatedPassIds = new Set(variables.passIds);

      const errors = response.errors ?? [];
      if (errors.length > 0) {
        onPartialFailure?.(errors, variables);
        errors.forEach((error) => updatedPassIds.delete(error.gamePassId));
      }

      setGamePassManagedPricingCaches({
        queryClient: context.client,
        universeId,
        updatedPassIds,
        enabled: variables.enabled,
      });

      onSuccess?.(response, variables, onSuccessResult, context);
    },
    ...options,
  });
}

import { useCallback, useMemo } from 'react';
import { useIsMutating } from '@tanstack/react-query';
import { developerProductKeys } from '@modules/developer-products/queries/constants';
import { useBatchUpdateDeveloperProductsManagedPricing } from '@modules/developer-products/queries/useBatchUpdateDeveloperProductsManagedPricing';
import { noop } from '@modules/monetization-shared/noop';
import { useStableCallback } from '@modules/monetization-shared/useStableCallback';
import { gamePassKeys } from '@modules/passes/queries/constants';
import { useBatchUpdateGamePassesManagedPricing } from '@modules/passes/queries/useBatchUpdateGamePassesManagedPricing';
import type { ManagedProduct, ManagedProductType } from '../../types';

export type ManagedProductUpdateError = {
  id: number;
  type: ManagedProductType;
  errorMessage: string;
};

export type BatchUpdateManagedProductsResult = {
  errors: ManagedProductUpdateError[];
};

type MutationVariables = {
  items: ManagedProduct[];
  enabled: boolean;
};

export type UseBatchUpdateManagedProductsStatusParams = {
  universeId: number;
};

// TODO(DMP-1611,@jeminpark): flesh this out more with API integration
type Options = {
  onSuccess?: (result: BatchUpdateManagedProductsResult, variables: MutationVariables) => void;
  onPartialFailure?: (
    errors: BatchUpdateManagedProductsResult['errors'],
    variables: MutationVariables,
  ) => void;
  onError?: (error: Error, variables: MutationVariables) => void;
};

/**
 * Composition hook that delegates managed-pricing status updates to
 * product-type-specific hooks and aggregates their results.
 *
 * Splits incoming {@link ManagedProduct} items by type, runs both mutations
 * in parallel, and merges errors into a unified {@link BatchUpdateManagedProductsResult}.
 */
export function useBatchUpdateManagedProductsStatus(
  { universeId }: UseBatchUpdateManagedProductsStatusParams,
  { onSuccess, onPartialFailure, onError }: Options = {},
) {
  const { mutateAsync: updateDeveloperProducts, isPending: isDeveloperProductsPending } =
    useBatchUpdateDeveloperProductsManagedPricing({ universeId });

  const { mutateAsync: updateGamePasses, isPending: isGamePassesPending } =
    useBatchUpdateGamePassesManagedPricing({ universeId });

  const stableOnSuccess = useStableCallback(onSuccess ?? noop);
  const stableOnPartialFailure = useStableCallback(onPartialFailure ?? noop);
  const stableOnError = useStableCallback(onError ?? noop);

  const mutateAsync = useCallback(
    async (variables: MutationVariables): Promise<BatchUpdateManagedProductsResult> => {
      const { items, enabled } = variables;

      const developerProductIds = items
        .filter((item) => item.type === 'DeveloperProduct')
        .map((item) => item.id); // Note: this is productID
      const gamePassIds = items.filter((item) => item.type === 'GamePass').map((item) => item.id);

      const [developerProductsResult, gamePassesResult] = await Promise.allSettled([
        developerProductIds.length > 0
          ? updateDeveloperProducts({ productIds: developerProductIds, enabled })
          : Promise.resolve({ errors: undefined }),
        gamePassIds.length > 0
          ? updateGamePasses({ passIds: gamePassIds, enabled })
          : Promise.resolve({ errors: undefined }),
      ]);

      const submittedMutations =
        Number(developerProductIds.length > 0) + Number(gamePassIds.length > 0);
      const rejectedMutations =
        Number(developerProductsResult.status === 'rejected' && developerProductIds.length > 0) +
        Number(gamePassesResult.status === 'rejected' && gamePassIds.length > 0);

      if (submittedMutations > 0 && submittedMutations === rejectedMutations) {
        let reason: unknown = new Error('Unknown error');
        /* istanbul ignore else -- all submitted mutations rejected, so one result has a reason. */
        if (developerProductsResult.status === 'rejected') {
          reason = developerProductsResult.reason;
        } else if (gamePassesResult.status === 'rejected') {
          reason = gamePassesResult.reason;
        }
        const error = reason instanceof Error ? reason : new Error('Unknown error');
        stableOnError(error, variables);
        throw error;
      }

      let developerProductErrors: ManagedProductUpdateError[];
      if (developerProductsResult.status === 'fulfilled') {
        developerProductErrors = (developerProductsResult.value.errors ?? []).map((error) => ({
          id: error.productId,
          type: 'DeveloperProduct',
          errorMessage: error.error?.errorMessage ?? 'Unknown error',
        }));
      } else {
        developerProductErrors = developerProductIds.map((id) => ({
          id,
          type: 'DeveloperProduct',
          errorMessage:
            developerProductsResult.reason instanceof Error
              ? developerProductsResult.reason.message
              : 'Unknown error',
        }));
      }

      let gamePassErrors: ManagedProductUpdateError[];
      if (gamePassesResult.status === 'fulfilled') {
        gamePassErrors = (gamePassesResult.value.errors ?? []).map((error) => ({
          id: error.gamePassId,
          type: 'GamePass',
          errorMessage: error.error?.errorMessage ?? 'Unknown error',
        }));
      } else {
        gamePassErrors = gamePassIds.map((id) => ({
          id,
          type: 'GamePass',
          errorMessage:
            gamePassesResult.reason instanceof Error
              ? gamePassesResult.reason.message
              : 'Unknown error',
        }));
      }

      const result: BatchUpdateManagedProductsResult = {
        errors: [...developerProductErrors, ...gamePassErrors],
      };
      if (result.errors.length > 0) {
        stableOnPartialFailure(result.errors, variables);
      }
      stableOnSuccess(result, variables);
      return result;
    },
    [
      updateDeveloperProducts,
      updateGamePasses,
      stableOnPartialFailure,
      stableOnSuccess,
      stableOnError,
    ],
  );

  const isPending = isDeveloperProductsPending || isGamePassesPending;

  return useMemo(
    () => ({
      mutateAsync,
      isPending,
    }),
    [mutateAsync, isPending],
  );
}

export function useIsBatchUpdateManagedProductsStatusPending({
  universeId,
}: UseBatchUpdateManagedProductsStatusParams) {
  const isDeveloperProductsPending = useIsMutating({
    mutationKey: developerProductKeys.batchUpdate(universeId),
  });

  const isGamePassesPending = useIsMutating({
    mutationKey: gamePassKeys.batchUpdate(universeId),
  });

  return Boolean(isDeveloperProductsPending) || Boolean(isGamePassesPending);
}

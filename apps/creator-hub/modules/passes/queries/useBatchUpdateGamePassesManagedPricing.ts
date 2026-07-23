/* istanbul ignore file */
import type { GamePassBulkUpdateResponse } from '@rbx/clients/gamePassesHttpService/v1';
import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { setGamePassRegionalPricingCaches } from './useBulkUpdateRegionalPricingForPasses';
import { gamePassKeys } from './constants';

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

/**
 * Batch-updates the managed pricing status for game passes.
 */
// eslint-disable-next-line import/prefer-default-export -- named export
export function useBatchUpdateGamePassesManagedPricing(
  { universeId }: { universeId: number },
  { onSuccess, onPartialFailure, ...options }: Options = {},
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: gamePassKeys.batchUpdate(universeId),
    mutationFn: async (): Promise<GamePassBulkUpdateResponse> => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { errors: [] };
    },
    onSuccess: (response, variables, onSuccessResult, context) => {
      const updatedPassIds = new Set(variables.passIds);

      const isPartialFailure = !!response.errors?.length;
      if (isPartialFailure) {
        onPartialFailure?.(response.errors!, variables);
        response.errors!.forEach((error) => updatedPassIds.delete(error.gamePassId));
      }

      // TODO: update to use Managed Pricing status
      setGamePassRegionalPricingCaches({
        queryClient,
        universeId,
        updatedPassIds,
        enabled: variables.enabled,
      });

      onSuccess?.(response, variables, onSuccessResult, context);
    },
    ...options,
  });
}

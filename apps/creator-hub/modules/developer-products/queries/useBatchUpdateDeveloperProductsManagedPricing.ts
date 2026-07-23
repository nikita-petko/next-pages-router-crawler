/* istanbul ignore file */
import type { BulkUpdateDeveloperProductsResponse } from '@rbx/clients/developerProductsApi';
import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { setDeveloperProductRegionalPricingCaches } from './useBulkUpdateRegionalPricingForDeveloperProducts';
import { developerProductKeys } from './constants';

type MutationVariables = {
  productIds: number[];
  enabled: boolean;
};

type Options = Omit<
  UseMutationOptions<BulkUpdateDeveloperProductsResponse, Error, MutationVariables>,
  'mutationFn'
> & {
  onPartialFailure?: (
    errors: BulkUpdateDeveloperProductsResponse['errors'],
    variables: MutationVariables,
  ) => void;
};

/**
 * Batch-updates the managed pricing status for developer products.
 */
// eslint-disable-next-line import/prefer-default-export -- named export
export function useBatchUpdateDeveloperProductsManagedPricing(
  { universeId }: { universeId: number },
  { onSuccess, onPartialFailure, ...options }: Options = {},
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: developerProductKeys.batchUpdate(universeId),
    mutationFn: async (): Promise<BulkUpdateDeveloperProductsResponse> => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { errors: [] };
    },
    onSuccess: (response, variables, onSuccessResult, context) => {
      const updatedProductIds = new Set(variables.productIds);

      const isPartialFailure = !!response.errors?.length;
      if (isPartialFailure) {
        onPartialFailure?.(response.errors!, variables);
        response.errors!.forEach((error) => updatedProductIds.delete(error.productId));
      }

      // TODO: update to use Managed Pricing status
      setDeveloperProductRegionalPricingCaches({
        queryClient,
        universeId,
        updatedProductIds,
        enabled: variables.enabled,
      });

      onSuccess?.(response, variables, onSuccessResult, context);
    },
    ...options,
  });
}

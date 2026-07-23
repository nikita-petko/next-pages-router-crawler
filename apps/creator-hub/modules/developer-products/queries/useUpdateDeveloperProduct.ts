import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import type { DeveloperProductsUpdateDeveloperProductV2Request } from '@rbx/client-developer-products-api/v1';
import developerProductsClient from '@modules/clients/developerProducts';
import { shopsKeys } from '@modules/shops/queries/constants';
import { DEFAULT_RETRIES, developerProductKeys } from './constants';
import { parseDeveloperProductErrorCode } from './errors';

type UseUpdateDeveloperProductParams = {
  universeId: number;
  productId: number;
  shopId?: number;
};

type MutationVariables = Omit<
  DeveloperProductsUpdateDeveloperProductV2Request,
  'universeId' | 'productId'
>;

type Options = Omit<UseMutationOptions<boolean, Error, MutationVariables>, 'mutationFn'> & {
  /**
   * Handler for API error responses, where errorKey is the string key for the error message.
   * Return true to skip the default `onError` callback.
   */
  onErrorResponse?: (
    errorKey: string | undefined,
    error: Error,
    variables: MutationVariables,
    context: unknown,
  ) => (boolean | void) | Promise<boolean | void>;
};

export function useUpdateDeveloperProduct(
  params: UseUpdateDeveloperProductParams,
  { onErrorResponse, onError, onSuccess, onSettled, ...options }: Options = {},
) {
  return useMutation({
    mutationKey: developerProductKeys.update(params.universeId, params.productId),
    mutationFn: async (variables) => {
      await developerProductsClient.updateDeveloperProduct({
        universeId: params.universeId,
        productId: params.productId,
        ...variables,
      });
      return true;
    },
    retry: DEFAULT_RETRIES,
    onSuccess: (data, variables, onMutateResult, context) => {
      // Refresh the personalized shop's item list so it reflects the updated product.
      if (params.shopId !== undefined) {
        void context.client.invalidateQueries({ queryKey: shopsKeys.itemsByShop(params.shopId) });
      }

      onSuccess?.(data, variables, onMutateResult, context);
    },
    onSettled: (data, error, variables, onSettledResult, context) => {
      void context.client.invalidateQueries({
        queryKey: developerProductKeys.all(params.universeId),
      });

      onSettled?.(data, error, variables, onSettledResult, context);
    },
    onError: async (error, variables, onErrorResult, context) => {
      const errorKey = await parseDeveloperProductErrorCode(error);

      const skipOnError = await onErrorResponse?.(errorKey, error, variables, context);
      if (skipOnError) {
        return;
      }

      onError?.(error, variables, onErrorResult, context);
    },
    ...options,
  });
}

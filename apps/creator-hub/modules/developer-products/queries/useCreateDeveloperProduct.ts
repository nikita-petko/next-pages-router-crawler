import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import type {
  DeveloperProductConfigV2,
  DeveloperProductsCreateDeveloperProductV2Request,
} from '@rbx/client-developer-products-api/v1';
import developerProductsClient from '@modules/clients/developerProducts';
import { shopsKeys } from '@modules/shops/queries/constants';
import { DEFAULT_RETRIES, developerProductKeys } from './constants';
import { parseDeveloperProductErrorCode } from './errors';

type UseCreateDeveloperProductParams = {
  universeId: number;
  shopId?: number;
};

type MutationVariables = Omit<DeveloperProductsCreateDeveloperProductV2Request, 'universeId'>;

type Options = Omit<
  UseMutationOptions<DeveloperProductConfigV2, Error, MutationVariables>,
  'mutationFn'
> & {
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

export function useCreateDeveloperProduct(
  params: UseCreateDeveloperProductParams,
  { onErrorResponse, onError, onSuccess, onSettled, ...options }: Options = {},
) {
  return useMutation({
    mutationKey: developerProductKeys.create(params.universeId),
    mutationFn: (variables) =>
      developerProductsClient.createDeveloperProduct({
        universeId: params.universeId,
        ...variables,
      }),
    retry: DEFAULT_RETRIES,
    onSuccess: (data, variables, onMutateResult, context) => {
      // Refresh the personalized shop's item list so the newly created product shows up.
      if (params.shopId !== undefined) {
        void context.client.invalidateQueries({ queryKey: shopsKeys.itemsByShop(params.shopId) });
      }

      onSuccess?.(data, variables, onMutateResult, context);
    },
    onSettled: (data, error, variables, onMutateResult, context) => {
      void context.client.invalidateQueries({
        queryKey: developerProductKeys.all(params.universeId),
      });

      onSettled?.(data, error, variables, onMutateResult, context);
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

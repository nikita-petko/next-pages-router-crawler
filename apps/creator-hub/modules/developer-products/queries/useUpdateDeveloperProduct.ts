import developerProductsClient from '@modules/clients/developerProducts';
import type { DeveloperProductsUpdateDeveloperProductV2Request } from '@rbx/clients/developerProductsApi';
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { parseDeveloperProductErrorCode } from './errors';
import { DEFAULT_RETRIES, developerProductKeys } from './constants';

type UseUpdateDeveloperProductParams = {
  universeId: number;
  productId: number;
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
  { onErrorResponse, onError, onSettled, ...options }: Options = {},
) {
  const queryClient = useQueryClient();

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
    onSettled: (data, error, variables, onSettledResult, context) => {
      queryClient.invalidateQueries({
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

export default useUpdateDeveloperProduct;

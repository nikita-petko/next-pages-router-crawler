import developerProductsClient from '@modules/clients/developerProducts';
import type {
  DeveloperProductConfigV2,
  DeveloperProductsCreateDeveloperProductV2Request,
} from '@rbx/clients/developerProductsApi';
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { parseDeveloperProductErrorCode } from './errors';
import { DEFAULT_RETRIES, developerProductKeys } from './constants';

type UseCreateDeveloperProductParams = {
  universeId: number;
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
  { onErrorResponse, onError, onSettled, ...options }: Options = {},
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: developerProductKeys.create(params.universeId),
    mutationFn: (variables) =>
      developerProductsClient.createDeveloperProduct({
        universeId: params.universeId,
        ...variables,
      }),
    retry: DEFAULT_RETRIES,
    onSettled: (data, error, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({
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

export default useCreateDeveloperProduct;

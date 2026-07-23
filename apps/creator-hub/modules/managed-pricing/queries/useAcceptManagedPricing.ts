import priceConfigurationApi from '@modules/clients/priceConfigurationApi';
import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { queryKeys } from './constants';

type Options = Omit<UseMutationOptions<void, Error, { universeId: number }>, 'mutationFn'>;

const DEFAULT_RETRIES = 3;

// TODO(jeminpark): add offline handling + sync
export function useAcceptManagedPricing({ onSettled, ...options }: Options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ universeId }: { universeId: number }) =>
      priceConfigurationApi.acceptManagedPricing(universeId),
    onSettled: (data, error, variables, onSettledResult, context) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.managedPricingStatus(variables.universeId),
      });

      onSettled?.(data, error, variables, onSettledResult, context);
    },
    retry: DEFAULT_RETRIES,
    ...options,
  });
}

export default useAcceptManagedPricing;

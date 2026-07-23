import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import priceConfigurationApi from '@modules/clients/priceConfigurationApi';
import { DEFAULT_RETRIES } from './constants';

type MutationVariables = {
  universeId: number;
};

type Options = Omit<UseMutationOptions<void, Error, MutationVariables>, 'mutationFn'>;

// TODO(jeminpark): add offline handling + sync
// Note consumers will handle optimistic update and invalidation
export function useAcceptManagedPricing(options: Options = {}) {
  return useMutation({
    mutationFn: ({ universeId }: MutationVariables) =>
      priceConfigurationApi.acceptManagedPricing(universeId),
    retry: DEFAULT_RETRIES,
    ...options,
  });
}

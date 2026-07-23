import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import type { CreateShopConfigByScopeResponse, ShopsEntryPoint } from '@modules/clients/shops';
import shopsApiClient from '@modules/clients/shops';
import { shopsKeys } from './constants';

type Options = Omit<UseMutationOptions<CreateShopConfigByScopeResponse>, 'mutationFn'>;

export function useCreateShop(
  universeId: number,
  entryPoints?: ShopsEntryPoint[],
  options: Options = {},
) {
  return useMutation({
    mutationFn: () =>
      shopsApiClient.createShopConfigByScope(
        { type: 'Universe', scopeId: String(universeId) },
        entryPoints,
      ),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      void context.client.invalidateQueries({ queryKey: shopsKeys.byUniverse(universeId) });
      options.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}

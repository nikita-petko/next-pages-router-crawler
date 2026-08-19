import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import type {
  BatchUpdateShopItemsResponse,
  EntryPoint,
  ListShopsByScopeResponse,
} from '@rbx/client-shops-api/v1';
import shopsApiClient from '@modules/clients/shops';
import { shopsKeys } from './constants';

type MutationVariables = { shopId: number; entryPoints: EntryPoint[] };
type MutateContext = { previousData: ListShopsByScopeResponse | undefined };

type Options = Omit<
  UseMutationOptions<BatchUpdateShopItemsResponse, Error, MutationVariables, MutateContext>,
  'mutationFn'
>;

export function useUpdateEntryPoints(universeId: number, options: Options = {}) {
  const queryKey = shopsKeys.byUniverse(universeId);

  return useMutation({
    mutationFn: ({ shopId, entryPoints }: MutationVariables) =>
      shopsApiClient.batchUpdateShopItems(shopId, { changedEntryPoints: entryPoints }),

    onMutate: async ({ shopId, entryPoints: newEntryPoints }, context) => {
      await context.client.cancelQueries({ queryKey });

      const previousData = context.client.getQueryData<ListShopsByScopeResponse>(queryKey);

      // Optimistically update the entry points for the shop in the cached list of shops
      if (previousData) {
        context.client.setQueryData<ListShopsByScopeResponse>(queryKey, {
          ...previousData,
          shops: previousData.shops.map((shop) => {
            if (shop.shopId !== shopId) {
              return shop;
            }

            // Only update the entry points that were changed for the specified shop
            return {
              ...shop,
              entryPoints: shop.entryPoints.map((ep) => {
                const changed = newEntryPoints.find((v) => v.name === ep.name);
                return changed ?? ep;
              }),
            };
          }),
        });
      }

      return { previousData };
    },

    onError: (error, variables, onMutateResult, context) => {
      if (onMutateResult?.previousData !== undefined) {
        context.client.setQueryData(queryKey, onMutateResult.previousData);
      }
      options.onError?.(error, variables, onMutateResult, context);
    },

    onSuccess: (data, variables, onMutateResult, context) => {
      void context.client.invalidateQueries({ queryKey });
      options.onSuccess?.(data, variables, onMutateResult, context);
    },

    ...options,
  });
}

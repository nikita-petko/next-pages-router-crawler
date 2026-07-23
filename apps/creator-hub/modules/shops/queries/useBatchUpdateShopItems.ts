import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import type { BatchUpdateShopItemsResponse } from '@rbx/client-shops-api/v1';
import shopsApiClient from '@modules/clients/shops';
import { getResponseFromError } from '@modules/clients/utils';
import { applyOptimisticShopItemEdits } from '../item-catalog/utils/applyOptimisticShopItemEdits';
import {
  transformBatchUpdateShopItemsRequest,
  type PendingShopItemEdits,
} from '../item-catalog/utils/transformBatchUpdateShopItemsRequest';
import { DEFAULT_RETRIES, shopsKeys } from './constants';

type MutationVariables = { shopId: number } & PendingShopItemEdits;

type Options = Omit<
  UseMutationOptions<BatchUpdateShopItemsResponse, Error, MutationVariables>,
  'mutationFn'
>;

function shouldRetryBatchUpdate(failureCount: number, error: Error): boolean {
  const status = getResponseFromError(error)?.status;
  if (status && status >= 400 && status < 500) {
    return false;
  }
  return failureCount < DEFAULT_RETRIES;
}

/**
 * Batch-updates a shop's items: transforms the provided edit state into a
 * `BatchUpdateShopItemsRequest` and sends it.
 *
 * On success the cached items and categories are optimistically patched before
 * `onSuccess` is forwarded, then the caches are invalidated. On error the caches
 * and local drafts are left untouched.
 */
export function useBatchUpdateShopItems({ onSuccess, onError, ...options }: Options = {}) {
  return useMutation({
    mutationFn: ({ shopId, ...edits }: MutationVariables) =>
      shopsApiClient.batchUpdateShopItems(shopId, transformBatchUpdateShopItemsRequest(edits)),
    // Retry up to the default limit, but skip retries for 4xx errors
    retry: shouldRetryBatchUpdate,
    onSuccess: (data, variables, onMutateResult, context) => {
      const { client } = context;
      // Patch the cache to the published state before forwarding `onSuccess`
      applyOptimisticShopItemEdits(client, variables, data.createdCategories);
      onSuccess?.(data, variables, onMutateResult, context);

      void client.invalidateQueries({ queryKey: shopsKeys.itemsByShop(variables.shopId) });
      void client.invalidateQueries({ queryKey: shopsKeys.configByShop(variables.shopId) });
    },
    // Intentionally leaves caches untouched so the caller can recover/retry
    onError: (error, variables, onErrorResult, context) => {
      onError?.(error, variables, onErrorResult, context);
    },
    ...options,
  });
}

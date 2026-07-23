/* istanbul ignore file */
import { useMutation, type QueryClient, type UseMutationOptions } from '@tanstack/react-query';
import {
  ErrorCode,
  type BatchGetDeveloperProductConfigsResponse,
  type BulkUpdateDeveloperProductsResponse,
  type DeveloperProductConfigV2,
  type DeveloperProductUpdate,
  type DeveloperProductUpdateError,
} from '@rbx/client-developer-products-api/v1';
import developerProductsClient from '@modules/clients/developerProducts';
import { executeBatchedUpdates } from '@modules/monetization-shared/batch-updates';
import { useMonetizationFlags } from '@modules/monetization-shared/flags/useMonetizationFlags';
import { hasManagedPricingEnabled } from '../utils/developerProductUtils';
import {
  developerProductKeys,
  matchesDeveloperProductBatchConfigsQuery,
  matchesDeveloperProductListQuery,
} from './constants';
import type {
  InfiniteListDeveloperProductsData,
  ListDeveloperProductsConfigsResponse,
} from './useInfiniteListDeveloperProducts';

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

const DEFAULT_BATCH_LIMIT = 30;

async function bulkUpdateManagedPricingForDeveloperProducts({
  universeId,
  productIds,
  enabled,
}: {
  universeId: number;
  productIds: number[];
  enabled: boolean;
}): Promise<BulkUpdateDeveloperProductsResponse> {
  const updates = productIds.map((productId) => ({
    productId,
    changedProperties: {
      isManagedPricingEnabled: enabled,
    },
  })) satisfies DeveloperProductUpdate[];

  return executeBatchedUpdates(
    updates,
    {
      executeBatch: (chunk) =>
        developerProductsClient.batchUpdateDeveloperProducts({
          universeId,
          body: { developerProductUpdates: chunk },
        }),
      getPartialErrors: (response) => response.errors ?? [],
      createBatchFailureError: (update, reason): DeveloperProductUpdateError => ({
        productId: update.productId,
        error: {
          errorCode: ErrorCode.UnknownError,
          errorMessage: reason instanceof Error ? reason.message : 'Unknown error',
        },
      }),
    },
    { batchLimit: DEFAULT_BATCH_LIMIT },
  );
}

function setDeveloperProductManagedPricing(
  product: Readonly<DeveloperProductConfigV2>,
  enabled: boolean,
): Readonly<DeveloperProductConfigV2> {
  if (hasManagedPricingEnabled(product) === enabled) {
    return product;
  }
  return { ...product, isManagedPricingEnabled: enabled };
}

export function updateDeveloperProductsManagedPricingQueryData(params: {
  oldData: InfiniteListDeveloperProductsData | undefined;
  updatedProductIds: Set<number>;
  enabled: boolean;
}): InfiniteListDeveloperProductsData | undefined {
  const { oldData, updatedProductIds, enabled } = params;
  if (!oldData) {
    return undefined;
  }
  if (updatedProductIds.size === 0) {
    return oldData;
  }

  let hasUpdates = false;
  const updatedPages = oldData.pages.map((page) => {
    const updatedOverview = page.developerProducts?.map((product) => {
      if (!updatedProductIds.has(product.productId)) {
        return product;
      }
      const updated = setDeveloperProductManagedPricing(product, enabled);
      if (updated !== product) {
        hasUpdates = true;
      }
      return updated;
    });

    return {
      developerProducts: updatedOverview,
      nextPageToken: page.nextPageToken,
    } satisfies ListDeveloperProductsConfigsResponse;
  });

  if (!hasUpdates) {
    return oldData;
  }

  return {
    pages: updatedPages,
    pageParams: oldData.pageParams,
  };
}

export function updateBatchGetDeveloperProductsManagedPricingQueryData(params: {
  oldData: BatchGetDeveloperProductConfigsResponse | undefined;
  updatedProductIds: Set<number>;
  enabled: boolean;
}): BatchGetDeveloperProductConfigsResponse | undefined {
  const { oldData, updatedProductIds, enabled } = params;
  if (!oldData?.developerProducts) {
    return oldData;
  }
  if (updatedProductIds.size === 0) {
    return oldData;
  }

  let hasUpdates = false;
  const updatedProducts = oldData.developerProducts.map((product) => {
    if (!updatedProductIds.has(product.productId)) {
      return product;
    }
    const updated = setDeveloperProductManagedPricing(product, enabled);
    if (updated !== product) {
      hasUpdates = true;
    }
    return updated;
  });

  return hasUpdates ? { ...oldData, developerProducts: updatedProducts } : oldData;
}

export function updateDeveloperProductConfigManagedPricingQueryData(params: {
  oldData: DeveloperProductConfigV2 | undefined;
  enabled: boolean;
}): DeveloperProductConfigV2 | undefined {
  const { oldData, enabled } = params;
  if (!oldData) {
    return undefined;
  }
  return setDeveloperProductManagedPricing(oldData, enabled);
}

/**
 * High-level cache writer: updates all developer product cache layers
 * (list, batch-get, individual config) for the given product IDs.
 */
export function setDeveloperProductManagedPricingCaches(params: {
  queryClient: QueryClient;
  universeId: number;
  updatedProductIds: Set<number>;
  enabled: boolean;
}): void {
  const { queryClient, universeId, updatedProductIds, enabled } = params;

  queryClient.setQueriesData<InfiniteListDeveloperProductsData>(
    { predicate: (query) => matchesDeveloperProductListQuery(query, universeId) },
    (oldData) =>
      updateDeveloperProductsManagedPricingQueryData({
        oldData,
        updatedProductIds,
        enabled,
      }),
  );

  queryClient.setQueriesData<BatchGetDeveloperProductConfigsResponse>(
    { predicate: (query) => matchesDeveloperProductBatchConfigsQuery(query, universeId) },
    (oldData) =>
      updateBatchGetDeveloperProductsManagedPricingQueryData({
        oldData,
        updatedProductIds,
        enabled,
      }),
  );

  updatedProductIds.forEach((productId) => {
    queryClient.setQueryData<DeveloperProductConfigV2>(
      developerProductKeys.config(universeId, productId),
      (oldData) =>
        updateDeveloperProductConfigManagedPricingQueryData({
          oldData,
          enabled,
        }),
    );
  });
}

/**
 * Batch-updates the managed pricing status for developer products.
 */
export function useBatchUpdateDeveloperProductsManagedPricing(
  { universeId }: { universeId: number },
  { onSuccess, onPartialFailure, ...options }: Options = {},
) {
  const { mockManagedPricingProductWrites } = useMonetizationFlags(
    'mockManagedPricingProductWrites',
  );

  return useMutation({
    mutationKey: developerProductKeys.batchUpdate(universeId),
    mutationFn: async ({ productIds, enabled }): Promise<BulkUpdateDeveloperProductsResponse> => {
      if (mockManagedPricingProductWrites ?? false) {
        await new Promise((resolve) => {
          setTimeout(resolve, 1000);
        });
        return { errors: [] };
      }

      return bulkUpdateManagedPricingForDeveloperProducts({ universeId, productIds, enabled });
    },
    onSuccess: (response, variables, onSuccessResult, context) => {
      const updatedProductIds = new Set(variables.productIds);

      const isPartialFailure = !!response.errors?.length;
      if (isPartialFailure) {
        onPartialFailure?.(response.errors, variables);
        response.errors.forEach((error) => updatedProductIds.delete(error.productId));
      }

      setDeveloperProductManagedPricingCaches({
        queryClient: context.client,
        universeId,
        updatedProductIds,
        enabled: variables.enabled,
      });

      onSuccess?.(response, variables, onSuccessResult, context);
    },
    ...options,
  });
}

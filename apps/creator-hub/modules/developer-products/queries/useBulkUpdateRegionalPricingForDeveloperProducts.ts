import developerProductsClient from '@modules/clients/developerProducts';
import {
  type BatchGetDeveloperProductConfigsResponse,
  type BulkUpdateDeveloperProductsResponse,
  type DeveloperProductConfigV2,
  type DeveloperProductUpdate,
  type DeveloperProductUpdateError,
  ErrorCode,
} from '@rbx/clients/developerProductsApi';
import {
  useMutation,
  useQueryClient,
  type QueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import type { RetryOptions } from '@modules/monetization-shared/retry';
import {
  executeBatchedUpdates,
  type BatchExecutionConfig,
} from '@modules/monetization-shared/batch-updates';
import { hasRegionalPricingEnabled } from '../utils/developerProductUtils';
import {
  BULK_UPDATE_LIMIT,
  MAX_WRITE_LIMIT,
  developerProductKeys,
  matchesDeveloperProductListQuery,
  matchesDeveloperProductBatchConfigsQuery,
} from './constants';
import type {
  InfiniteListDeveloperProductsData,
  ListDeveloperProductsConfigsResponse,
} from './useInfiniteListDeveloperProducts';

type Options = Omit<
  UseMutationOptions<BulkUpdateDeveloperProductsResponse, Error, MutationVariables>,
  'mutationFn'
> & {
  onPartialFailure?: (
    errors: BulkUpdateDeveloperProductsResponse['errors'],
    variables: MutationVariables,
  ) => void;
  batchRetry?: RetryOptions['retry'];
  batchRetryDelay?: RetryOptions['retryDelay'];
};

type UseBulkUpdateDeveloperProductParams = {
  universeId: number;
  /** Maximum number of products to update in a single batch. Cannot exceed {@link MAX_WRITE_LIMIT}. */
  batchLimit?: BatchExecutionConfig['batchLimit'];
  /** Maximum number of products that can be updated in total. Defaults to {@link BULK_UPDATE_LIMIT}. */
  totalLimit?: BatchExecutionConfig['totalLimit'];
} & Omit<BatchExecutionConfig, 'batchLimit' | 'totalLimit'>;

type MutationVariables = {
  /** Product IDs to update. */
  productIds: number[];
  /** Whether to enable regional pricing for the products. */
  enabled: boolean;
};

/** Default retries for attempted update. Note this is not the same as the retries for a single batch call. */
const DEFAULT_RETRIES = 1;

/** Default batch limit for a single batch call */
const DEFAULT_BATCH_LIMIT = 30; // This seems to be the sweet spot, price-engine can't consistently handle larger

/**
 * Updates the regional pricing status for a list of developer products.
 *
 * Delegates to {@link executeBatchedUpdates} for batching, retries, and error aggregation
 * to avoid exceeding the maximum write limit.
 */
export async function bulkUpdateRegionalPricingForDeveloperProducts({
  universeId,
  productIds,
  enabled,
  batchLimit = DEFAULT_BATCH_LIMIT,
  totalLimit = BULK_UPDATE_LIMIT,
  ...batchOptions
}: UseBulkUpdateDeveloperProductParams & MutationVariables) {
  const updates = productIds.map((productId) => ({
    productId,
    changedProperties: {
      isRegionalPricingEnabled: enabled,
    },
  })) satisfies DeveloperProductUpdate[];

  return executeBatchedUpdates(
    updates,
    {
      executeBatch: (chunk) =>
        developerProductsClient.updateDeveloperProducts({
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
    { batchLimit, totalLimit, ...batchOptions },
  );
}

/**
 * Toggles the `RegionalPricing` feature flag on a single developer product config.
 * Returns the same reference if nothing changed (no `priceInformation`).
 */
function setRegionalPricing(
  product: Readonly<DeveloperProductConfigV2>,
  enabled: boolean,
): Readonly<DeveloperProductConfigV2> {
  // Note: price information must exist to set regional pricing, this just exists as a defensive check
  if (!product.priceInformation) {
    return product;
  }

  const features = product.priceInformation.enabledFeatures;

  let updatedFeatures: typeof features;
  if (enabled) {
    updatedFeatures = features.includes('RegionalPricing')
      ? features
      : [...features, 'RegionalPricing'];
  } else {
    updatedFeatures = features.filter((f) => f !== 'RegionalPricing');
  }

  return {
    ...product,
    priceInformation: {
      ...product.priceInformation,
      enabledFeatures: updatedFeatures,
    },
  };
}

/**
 * Updater function for updating query cache data for the developer products
 * infinite list query. Used for optimistic updates.
 *
 * If no changes were made, returns old data to not force unnecessary re-renders
 */
export function updateDeveloperProductsQueryData(params: {
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

      if (hasRegionalPricingEnabled(product) === enabled) {
        return product;
      }

      hasUpdates = true;
      return setRegionalPricing(product, enabled);
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

/**
 * Updater for batch-get developer product query caches (`developerProductKeys.batchConfigs`).
 * Toggles the `RegionalPricing` feature flag for matching products.
 */
export function updateBatchGetDeveloperProductsQueryData(params: {
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
    if (hasRegionalPricingEnabled(product) === enabled) {
      return product;
    }
    const updated = setRegionalPricing(product, enabled);
    if (updated !== product) {
      hasUpdates = true;
    }
    return updated;
  });

  if (!hasUpdates) {
    return oldData;
  }

  return { ...oldData, developerProducts: updatedProducts };
}

/**
 * Updater for individual developer product config query caches (`developerProductKeys.config`).
 */
export function updateDeveloperProductConfigQueryData(params: {
  oldData: DeveloperProductConfigV2 | undefined;
  enabled: boolean;
}): DeveloperProductConfigV2 | undefined {
  const { oldData, enabled } = params;
  if (!oldData) {
    return undefined;
  }
  if (hasRegionalPricingEnabled(oldData) === enabled) {
    return oldData;
  }
  return setRegionalPricing(oldData, enabled);
}

/**
 * High-level cache writer: updates all developer product cache layers
 * (list, batch-get, individual config) for the given product IDs.
 */
export function setDeveloperProductRegionalPricingCaches(params: {
  queryClient: QueryClient;
  universeId: number;
  updatedProductIds: Set<number>;
  enabled: boolean;
}): void {
  const { queryClient, universeId, updatedProductIds, enabled } = params;

  queryClient.setQueriesData<InfiniteListDeveloperProductsData>(
    { predicate: (query) => matchesDeveloperProductListQuery(query, universeId) },
    (oldData) =>
      updateDeveloperProductsQueryData({
        oldData,
        updatedProductIds,
        enabled,
      }),
  );

  queryClient.setQueriesData<BatchGetDeveloperProductConfigsResponse>(
    { predicate: (query) => matchesDeveloperProductBatchConfigsQuery(query, universeId) },
    (oldData) =>
      updateBatchGetDeveloperProductsQueryData({
        oldData,
        updatedProductIds,
        enabled,
      }),
  );

  updatedProductIds.forEach((productId) => {
    queryClient.setQueryData<DeveloperProductConfigV2>(
      developerProductKeys.config(universeId, productId),
      (oldData) =>
        updateDeveloperProductConfigQueryData({
          oldData,
          enabled,
        }),
    );
  });
}

export function useBulkUpdateRegionalPricingForDeveloperProducts(
  params: UseBulkUpdateDeveloperProductParams,
  { onSuccess, onPartialFailure, batchRetry, batchRetryDelay, ...options }: Options = {},
) {
  if (params.batchLimit && params.batchLimit > MAX_WRITE_LIMIT) {
    throw new Error(`Batch limit cannot exceed ${MAX_WRITE_LIMIT}.`);
  }

  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: developerProductKeys.batchUpdate(params.universeId),
    mutationFn: (variables) =>
      bulkUpdateRegionalPricingForDeveloperProducts({
        ...params,
        ...variables,
        retry: batchRetry,
        retryDelay: batchRetryDelay,
      }),
    onSuccess: (response, variables, onSuccessResult, context) => {
      const updatedProductIds = new Set(variables.productIds);

      const isPartialFailure = !!response.errors?.length;
      if (isPartialFailure) {
        onPartialFailure?.(response.errors!, variables);
        response.errors.forEach((error) => updatedProductIds.delete(error.productId));
      }

      // Psuedo-optimistically update the cache for the developer products list
      // - else it'll take a while to reload with fresh data, especially on later pages.
      // TODO: consider moving this to `onMutate` for true optimistic UX if necessary.
      setDeveloperProductRegionalPricingCaches({
        queryClient,
        universeId: params.universeId,
        updatedProductIds,
        enabled: variables.enabled,
      });

      queryClient.invalidateQueries({ queryKey: developerProductKeys.all(params.universeId) });

      onSuccess?.(response, variables, onSuccessResult, context);
    },
    retry: DEFAULT_RETRIES,
    ...options,
  });
}

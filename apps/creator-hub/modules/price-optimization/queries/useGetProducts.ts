import priceExperimentationApi from '@modules/clients/priceExperimentation';
import {
  Experiment,
  ExperimentState,
  ListExperimentProductRecommendationsResponse,
  ListExperimentProductsResponse,
  ProductDetails,
  ProductRecommendation,
  ProductType,
} from '@rbx/clients/priceExperimentationApi/v1';
import { useCallback, useEffect, useMemo } from 'react';
import developerProductsClient from '@modules/clients/developerProducts';
import passesClient from '@modules/clients/passes';
import type { ListDeveloperProductsWithCreatorDetailsResponse } from '@rbx/clients/developerProductsApi';
import { useRouter } from 'next/router';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { type GamePassConfigV2, PricingFeature } from '@rbx/clients/gamePassesHttpService/v1';
import { useGetAllPassesForUniverse } from '@modules/passes/queries/useGetAllPassesForUniverse';
import { gamePassKeys } from '@modules/passes/queries/constants';
import { developerProductKeys } from '@modules/developer-products/queries/constants';
import {
  getExperimentProductsQueryKey,
  getUniverseDevProductsQueryKey,
  getGamePassesByIdsQueryKey,
  paginationLimit,
  queryRetry,
  rootQueryKey,
  staleTime,
} from './constants';
import useGetLatestExperiment from './useGetLatestExperiment';
import { Product } from '../types/product';
import usePagedQueryAll from './usePagedQueryAll';
import { isInitialExperimentComplete, isOngoingExperiment } from '../helpers/experimentUtils';
import { MICRO_MULTIPLE } from '../constants/metricsMetadata';

// Helper function to calculate optimization percentage from microunits
const calculateOptimizationPercentage = (
  recommendedPriceChangeInMicroUnits: number | null | undefined,
): number | null => {
  if (!recommendedPriceChangeInMicroUnits) {
    return null;
  }

  // Check for true no change (micro units = 0)
  if (recommendedPriceChangeInMicroUnits === 0) {
    return 0;
  }

  const recommendedPriceChange = (recommendedPriceChangeInMicroUnits * 100) / MICRO_MULTIPLE;

  // Round to 1 decimal place
  return Math.round(recommendedPriceChange * 10) / 10;
};

// Sort function to return products by product type, then ID
const productSortFn = (a: Product, b: Product) => {
  if (a.productType < b.productType) {
    return -1;
  }
  if (a.productType > b.productType) {
    return 1;
  }

  // They are same product type, sort by ID
  // Compare by product v3 ID if available since that's what users will see
  const aId = a.productV3Id || Number(a.productId) || a.productId;
  const bId = b.productV3Id || Number(b.productId) || b.productId;
  if (aId < bId) {
    return -1;
  }
  if (aId > bId) {
    return 1;
  }
  return 0;
};

// Function to fetch products in an experiment from the price experimentation API
// If experiment is ongoing, call the experiment products endpoint
// If the experiment is finished, call the experiment product recommendations endpoint
// This function is passed into react query
const fetchExperimentProducts = async (
  universeId: number,
  experimentId: string,
  experimentState: ExperimentState,
  limit?: number,
  cursor?: string,
): Promise<ListExperimentProductsResponse | ListExperimentProductRecommendationsResponse> => {
  if (isInitialExperimentComplete(experimentState)) {
    return priceExperimentationApi.priceExperimentationApiListExperimentProductRecommendations({
      universeId,
      experimentId,
      limit,
      cursor,
    });
  }
  if (experimentState === ExperimentState.Running) {
    return priceExperimentationApi.priceExperimentationApiListExperimentProducts({
      universeId,
      experimentId,
      limit,
      cursor,
    });
  }

  // This should never happen, we should be calling games/dev products api
  // and returning all universe products if no existing experiment in correct states
  throw new Error('Invalid experiment state');
};

// ---- Response Conversion Functions ----
// These functions convert raw responses from each API to an array of Product type

// Convert one call to the price experimentation API to an array of Product type
const convertExperimentProductsResponse = (
  productResponse: ListExperimentProductsResponse | ListExperimentProductRecommendationsResponse,
): Omit<Product, 'name' | 'iconId'>[] => {
  const experimentProducts: Array<ProductDetails | ProductRecommendation> = productResponse.data;

  return experimentProducts.filter(
    (product): product is Omit<Product, 'name' | 'iconId'> => product.productType !== 'Invalid',
  );
};

// Convert one call to the games API to an array of Product type
const convertUniverseGamePassesResponse = (gamePasses: GamePassConfigV2[]): Product[] =>
  gamePasses.map((gamePass) => ({
    name: gamePass.name,
    iconId: gamePass.iconAssetId,
    productId: gamePass.gamePassId.toString(),
    productType: ProductType.GamePass,
    defaultPriceInRobux: gamePass.isForSale
      ? (gamePass.priceInformation?.defaultPriceInRobux ?? 0)
      : 0,
    isRegionalPricingEnabled:
      gamePass.priceInformation?.enabledFeatures?.includes(PricingFeature.RegionalPricing) ?? false,
  }));

// Convert one call to the developer products API to an array of Product type
const convertUniverseDeveloperProductsResponse = (
  developerProductsResponse: ListDeveloperProductsWithCreatorDetailsResponse,
): Product[] => {
  if (!developerProductsResponse.developerProductsOverview) {
    return [];
  }
  return developerProductsResponse.developerProductsOverview.map((devProduct) => ({
    name: devProduct.name,
    iconId: devProduct.iconImageAssetId ?? 0,
    // eslint-disable-next-line deprecation/deprecation -- ignore until managed pricing migration
    productId: devProduct.developerProductId!.toString(),
    productV3Id: devProduct.productId,
    productType: ProductType.DeveloperProduct,
    defaultPriceInRobux: devProduct.isForSale
      ? (devProduct.priceInformation?.defaultPriceInRobux ?? 0)
      : 0,
    isRegionalPricingEnabled:
      devProduct.priceInformation?.enabledFeatures?.includes(PricingFeature.RegionalPricing) ??
      false,
  }));
};

// ---- End Response Conversion Functions ----

// ---- React Query Helper Functions ----
// These helper functions wrap calls to useQuery
function useGetUniverseGamePasses(universeId: number, enabled: boolean) {
  return useGetAllPassesForUniverse(universeId, {
    enabled,
    retry: queryRetry,
    limit: paginationLimit,
    select: (gamePasses) => convertUniverseGamePassesResponse(gamePasses),
    staleTime, // Use 1 min stale time for PO due to async experiment state updates
  });
}

function useGetUniverseDevProducts(universeId: number, enabled: boolean) {
  const pageMapper = useCallback(convertUniverseDeveloperProductsResponse, []);

  return usePagedQueryAll(
    {
      queryKey: [rootQueryKey, universeId, getUniverseDevProductsQueryKey],
      queryFn: ({ pageParam = '' }) =>
        developerProductsClient.listDeveloperProductsWithCreatorDetails({
          universeId,
          cursor: pageParam,
          limit: paginationLimit,
        }),
      getNextPageParam: (lastPage) =>
        lastPage.nextPageCursor ? lastPage.nextPageCursor : undefined,
      retry: queryRetry,
      staleTime: Infinity,
      enabled,
      initialPageParam: '',
    },
    pageMapper,
  );
}

function useGetExperimentProducts(
  universeId: number,
  currentExperiment: Experiment | null,
  enabled: boolean,
) {
  const pageMapper = useCallback(convertExperimentProductsResponse, []);

  return usePagedQueryAll(
    {
      queryKey: [rootQueryKey, universeId, getExperimentProductsQueryKey],
      queryFn: ({ pageParam }) =>
        fetchExperimentProducts(
          universeId,
          // Can cast to non-null Experiment as query is disabled if currentExperiment is null/undefined
          currentExperiment!.id,
          currentExperiment!.state,
          paginationLimit,
          pageParam,
        ),
      // Catch all falsy values as no more pages
      getNextPageParam: (lastPage) =>
        lastPage.nextPageCursor ? lastPage.nextPageCursor : undefined,
      retry: queryRetry,
      staleTime: Infinity,
      enabled,
      initialPageParam: '',
    },
    pageMapper,
  );
}

function useGetExperimentGamePasses(universeId: number, gamePassIds: number[], enabled: boolean) {
  // Note preferably we'd use useQueries to batch calls
  // In the case of game passes we can get away without it since we're guaranteed there are at most 50 for sale game passes
  // We can't use useQueries since it won't memoize the results correctly, see https://github.com/TanStack/query/issues/5137
  // Once we update to react-query v5 we can use useQueries
  const queryResult = useQuery({
    queryKey: [rootQueryKey, universeId, getGamePassesByIdsQueryKey, gamePassIds],
    queryFn: () => passesClient.batchGetGamePassConfigs({ universeId, gamePassIds }),
    retry: queryRetry,
    staleTime: Infinity,
    enabled,
  });

  const data = useMemo(
    () => (queryResult.data ? convertUniverseGamePassesResponse(queryResult.data.gamePasses) : []),
    [queryResult.data],
  );

  return {
    ...queryResult,
    data,
  };
}

/**
 * Invalidate products on page load in case users make changes in game passes/dev product page
 * which we want to show up here. Transitioning to shared queries across game passes and dev products,
 * so we cannot simply use `[rootQueryKey, universeId]` to invalidate all product queries.
 *
 * If `universeId` is passed, this will invalidate all product queries on mount.
 *
 * @param universeId
 * @returns callback function to manually invalidate product queries
 */
export function useInvalidateProducts(universeId?: number) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const invalidateProductQueries = useCallback(
    (universeIdToInvalidate = universeId) => {
      if (universeIdToInvalidate) {
        queryClient.invalidateQueries({
          queryKey: gamePassKeys.all(universeIdToInvalidate),
        });
        queryClient.invalidateQueries({
          queryKey: developerProductKeys.all(universeIdToInvalidate),
        });
        queryClient.invalidateQueries({
          queryKey: [rootQueryKey, universeIdToInvalidate, getUniverseDevProductsQueryKey],
        });
        queryClient.invalidateQueries({
          queryKey: [rootQueryKey, universeIdToInvalidate, getGamePassesByIdsQueryKey],
        });
      }
    },
    [queryClient, universeId],
  );

  useEffect(() => {
    if (universeId) {
      invalidateProductQueries();
    }
  }, [invalidateProductQueries, router.pathname, universeId]);

  return invalidateProductQueries;
}

// ---- End React Query Helper Functions ----

// This hook fetches products for the current experiment or universe depending on the current state of the experiment.
// It will use the react query helper functions defined above, then convert the responses to the Product type.
// The forceShowExperimentProducts is used for the finished polling states to show the experiment products in the background
// even when the current experiment is finished.
export default function useGetProducts(forceShowExperimentProducts = false) {
  const {
    universeId,
    latestExperiment: currentExperiment,
    isLoading: isCurrentExperimentLoading,
    isError: isCurrentExperimentError,
  } = useGetLatestExperiment();

  // Universe and current experiment (or lack of current experiment) are loaded
  const dependenciesLoaded = !isCurrentExperimentLoading && !isCurrentExperimentError;
  // We fetch experiment products if there is a current experiment, otherwise we fetch universe products
  const shouldFetchExperimentProducts =
    isOngoingExperiment(currentExperiment?.state) || forceShowExperimentProducts;

  // Get API responses using react query helper functions
  const {
    data: experimentProducts,
    isLoading: isLoadingExperimentProducts,
    isError: isErrorExperimentProducts,
  } = useGetExperimentProducts(
    // Can cast universeId and currentExperiment to defined values as query is disabled if they are undefined
    universeId!,
    currentExperiment as Experiment | null,
    dependenciesLoaded && shouldFetchExperimentProducts,
  );

  // If we have an ongoing experiment, we just get the data corresponding to
  // experiment game passes
  // If no ongoing experiment, return all the game pass data
  const {
    data: universeGamePasses = [],
    isLoading: isLoadingUniverseGamePasses,
    isError: isErrorUniverseGamePasses,
  } = useGetUniverseGamePasses(universeId!, dependenciesLoaded && !shouldFetchExperimentProducts);

  const {
    data: experimentGamePasses,
    isPending: isLoadingExperimentGamePasses,
    isError: isErrorExperimentGamePasses,
  } = useGetExperimentGamePasses(
    universeId!,
    experimentProducts
      .filter((prod) => prod.productType === ProductType.GamePass)
      .map((prod) => parseInt(prod.productId, 10)),
    dependenciesLoaded && shouldFetchExperimentProducts,
  );

  const gamePasses = shouldFetchExperimentProducts ? experimentGamePasses : universeGamePasses;

  // We always fetch dev product
  // If we have an ongoing experiment, the data is used to fill in name and icon for the experiment products
  // If no ongoing experiment, just return the dev product data
  const {
    data: universeDevProducts,
    isLoading: isLoadingUniverseDevProducts,
    isError: isErrorUniverseDevProducts,
  } = useGetUniverseDevProducts(universeId!, dependenciesLoaded);

  // Determine if we are loading products or have an error
  const isLoadingNoExperimentData = isLoadingUniverseGamePasses || isLoadingUniverseDevProducts;
  const isErrorNoExperimentData = isErrorUniverseGamePasses || isErrorUniverseDevProducts;

  const isLoadingHasExperimentData =
    isLoadingExperimentProducts || isLoadingExperimentGamePasses || isLoadingUniverseDevProducts;
  const isErrorHasExperimentData =
    isErrorExperimentProducts || isErrorExperimentGamePasses || isErrorUniverseDevProducts;

  // We are loading if our dependencies are not loaded,
  // or if the products we need to fetch are still loading
  const isLoading =
    isCurrentExperimentLoading ||
    (shouldFetchExperimentProducts && isLoadingHasExperimentData) ||
    (!shouldFetchExperimentProducts && isLoadingNoExperimentData);

  const isError =
    isCurrentExperimentError ||
    (shouldFetchExperimentProducts && isErrorHasExperimentData) ||
    (!shouldFetchExperimentProducts && isErrorNoExperimentData);

  // Convert raw responses to array of Product type
  const products = useMemo(() => {
    if (isLoading || isError) {
      return [];
    }

    let result: Product[] = [];
    if (shouldFetchExperimentProducts) {
      // We know experiment products, game passes, and dev products are all loaded since isLoading is false

      // Create maps from product id -> product data for game passes and dev product response from their respective product APIs
      const devProductMap = new Map(
        universeDevProducts.map((devProduct) => [devProduct.productId.toString(), devProduct]),
      );
      const gamePassesMap = new Map(
        gamePasses.map((gamePass) => [gamePass.productId.toString(), gamePass]),
      );

      // Fill in name and icon id for experiment products from the product apis
      // If the product is not found in the map, we return default empty values.
      // This should never happen.
      result = experimentProducts.map((experimentProduct) => {
        if (experimentProduct.productType === ProductType.DeveloperProduct) {
          const devProduct = devProductMap.get(experimentProduct.productId);
          return {
            ...experimentProduct,
            name: devProduct?.name ?? '',
            iconId: devProduct?.iconId ?? 0,
            // Include products v3 ID for dev products
            productV3Id: devProduct?.productV3Id,
            isRegionalPricingEnabled: devProduct?.isRegionalPricingEnabled ?? false,
            optimizationPercentage: calculateOptimizationPercentage(
              experimentProduct.recommendedPriceChangeInMicroUnits,
            ),
          };
        }
        if (experimentProduct.productType === ProductType.GamePass) {
          const gamePass = gamePassesMap.get(experimentProduct.productId);
          return {
            ...experimentProduct,
            name: gamePass?.name ?? '',
            iconId: gamePass?.iconId ?? 0,
            isRegionalPricingEnabled: gamePass?.isRegionalPricingEnabled ?? false,
            optimizationPercentage: calculateOptimizationPercentage(
              experimentProduct.recommendedPriceChangeInMicroUnits,
            ),
          };
        }
        // Should never happen
        return {
          name: '',
          iconId: 0,
          ...experimentProduct,
        };
      });
    } else {
      // We know game passes and dev products are all loaded since isLoading is false
      const onSaleGamePasses = gamePasses.filter((gamePass) => gamePass.defaultPriceInRobux > 0);
      const onSaleDevProducts = universeDevProducts.filter(
        (devProduct) => devProduct.defaultPriceInRobux > 0,
      );
      result = onSaleGamePasses.concat(onSaleDevProducts);
    }

    result.sort(productSortFn);
    return result;
  }, [
    isLoading,
    isError,
    shouldFetchExperimentProducts,
    gamePasses,
    universeDevProducts,
    experimentProducts,
  ]);

  return {
    products,
    isLoading,
    isError,
  };
}

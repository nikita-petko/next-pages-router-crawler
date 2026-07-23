import priceExperimentationApi from '@modules/clients/priceExperimentation';
import {
  AcceptProductRecommendationsResponse,
  ProductIdentifier,
  RejectProductRecommendationsResponse,
} from '@rbx/clients/priceExperimentationApi/v1';
import { UseMutateAsyncFunction, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { currentExperimentQueryKey, mutationLimit, mutationRetry, rootQueryKey } from './constants';
import { useInvalidateProducts } from './useGetProducts';

type RecommendationsVariables = {
  universeId: number;
  experimentId: string;
  products: ProductIdentifier[];
};

type ExperimentVariables = {
  universeId: number;
  experimentId: string;
};

type ApplyFunction = UseMutateAsyncFunction<
  AcceptProductRecommendationsResponse | RejectProductRecommendationsResponse,
  unknown,
  RecommendationsVariables,
  unknown
>;

// Returns products which failed to be updated
const applyRecommendations = async (
  applyFunction: ApplyFunction,
  universeId: number,
  experimentId: string,
  products: ProductIdentifier[],
): Promise<ProductIdentifier[]> => {
  if (products.length === 0) {
    return [];
  }

  // Batch the products
  const productBatches: ProductIdentifier[][] = [];
  for (let i = 0; i < products.length; i += mutationLimit) {
    productBatches.push(products.slice(i, Math.min(i + mutationLimit, products.length)));
  }

  // We use Promise.all instead of Promise.allSettled to throw on error
  // react-query already has a built in retry we are using
  // Future retries are for partial successes
  const results = await Promise.all(
    productBatches.map((batch) => applyFunction({ universeId, experimentId, products: batch })),
  );

  const failedProducts: ProductIdentifier[] = results.flatMap(
    (result) => result.failedRecommendationUpdates,
  );

  return failedProducts;
};

// Try to apply recommendations with one retry
const applyRecommendationsWithRetry = async (
  applyFunction: ApplyFunction,
  retry: number,
  universeId: number,
  experimentId: string,
  products: ProductIdentifier[],
) => {
  let productsToApply: ProductIdentifier[] = products;
  let retryNum = 0;
  do {
    // eslint-disable-next-line no-await-in-loop -- Need to do in a loop for retries. Loop will be limited by number of retries
    productsToApply = await applyRecommendations(
      applyFunction,
      universeId,
      experimentId,
      productsToApply,
    );
    retryNum += 1;
  } while (productsToApply.length > 0 && retryNum <= retry);

  if (productsToApply.length > 0) {
    throw new Error('Failed to apply recommendations');
  }
};

export default function useCompleteExperiment() {
  const queryClient = useQueryClient();

  const { mutateAsync: acceptRecommendations } = useMutation({
    mutationFn: async (variables: RecommendationsVariables) =>
      priceExperimentationApi.priceExperimentationApiAcceptProductRecommendations({
        universeId: variables.universeId,
        experimentId: variables.experimentId,
        priceExperimentationApiAcceptProductRecommendationsRequest: {
          products: variables.products,
        },
      }),
    retry: mutationRetry,
  });

  const { mutateAsync: rejectRecommendations } = useMutation({
    mutationFn: async (variables: RecommendationsVariables) =>
      priceExperimentationApi.priceExperimentationApiRejectProductRecommendations({
        universeId: variables.universeId,
        experimentId: variables.experimentId,
        priceExperimentationApiRejectProductRecommendationsRequest: {
          products: variables.products,
        },
      }),
    retry: mutationRetry,
  });

  const { mutateAsync: markExperimentCompleteRaw } = useMutation({
    mutationFn: async (variables: ExperimentVariables) =>
      priceExperimentationApi.priceExperimentationApiCompleteExperiment({
        universeId: variables.universeId,
        experimentId: variables.experimentId,
      }),
    retry: mutationRetry,
  });

  const { mutateAsync: startHoldout } = useMutation({
    mutationFn: async (variables: ExperimentVariables) =>
      priceExperimentationApi.priceExperimentationApiStartHoldout({
        universeId: variables.universeId,
        experimentId: variables.experimentId,
      }),
    retry: mutationRetry,
  });

  const { mutateAsync: restorePricesAndCompleteRaw } = useMutation({
    mutationFn: async (variables: ExperimentVariables) =>
      priceExperimentationApi.priceExperimentationApiRestorePrices({
        universeId: variables.universeId,
        experimentId: variables.experimentId,
      }),
    retry: mutationRetry,
  });

  const invalidateProductQueries = useInvalidateProducts();

  const completeExperiment = useCallback(
    async (
      universeId: number,
      experimentId: string,
      productsToAccept: ProductIdentifier[],
      productsToReject: ProductIdentifier[],
    ) => {
      await Promise.all([
        applyRecommendationsWithRetry(
          acceptRecommendations,
          mutationRetry,
          universeId,
          experimentId,
          productsToAccept,
        ),
        applyRecommendationsWithRetry(
          rejectRecommendations,
          mutationRetry,
          universeId,
          experimentId,
          productsToReject,
        ),
      ]);

      await markExperimentCompleteRaw({ universeId, experimentId });

      invalidateProductQueries(universeId);
    },
    [
      acceptRecommendations,
      rejectRecommendations,
      markExperimentCompleteRaw,
      invalidateProductQueries,
    ],
  );

  const markExperimentComplete = useCallback(
    async (universeId: number, experimentId: string) => {
      await markExperimentCompleteRaw({ universeId, experimentId });

      invalidateProductQueries(universeId);
    },
    [markExperimentCompleteRaw, invalidateProductQueries],
  );

  const completeExperimentAndStartHoldout = useCallback(
    async (universeId: number, experimentId: string, products: ProductIdentifier[]) => {
      await applyRecommendationsWithRetry(
        acceptRecommendations,
        mutationRetry,
        universeId,
        experimentId,
        products,
      );

      await startHoldout({ universeId, experimentId });

      invalidateProductQueries(universeId);
    },
    [acceptRecommendations, startHoldout, invalidateProductQueries],
  );

  const restorePricesAndComplete = useCallback(
    async (universeId: number, experimentId: string) => {
      await restorePricesAndCompleteRaw({ universeId, experimentId });
      queryClient.invalidateQueries({
        queryKey: [rootQueryKey, universeId, currentExperimentQueryKey],
      });
      invalidateProductQueries(universeId);
    },
    [restorePricesAndCompleteRaw, queryClient, invalidateProductQueries],
  );

  const refetchData = useCallback(
    (universeId: number) => {
      // Invalidate queries to trigger refetching all the data for universe, experiments, products, etc.
      invalidateProductQueries(universeId);
      queryClient.invalidateQueries({
        queryKey: [rootQueryKey, universeId],
      });
    },
    [queryClient, invalidateProductQueries],
  );

  return {
    completeExperiment,
    completeExperimentAndStartHoldout,
    refetchData,
    markExperimentComplete,
    restorePricesAndComplete,
  };
}

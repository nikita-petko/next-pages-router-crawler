import { useCallback } from 'react';
import type { UseMutateAsyncFunction } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  AcceptProductRecommendationsResponse,
  ProductIdentifier,
  RejectProductRecommendationsResponse,
} from '@rbx/client-price-experimentation-api/v1';
import priceExperimentationApi from '@modules/clients/priceExperimentation';
import { currentExperimentQueryKey, mutationLimit, mutationRetry, rootQueryKey } from './constants';
import { invalidateProductQueries } from './useGetProducts';

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
  RecommendationsVariables
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

export function useCompleteExperiment() {
  const queryClient = useQueryClient();

  const { mutateAsync: acceptRecommendations } = useMutation({
    mutationFn: async (variables: RecommendationsVariables) =>
      priceExperimentationApi.acceptProductRecommendations({
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
      priceExperimentationApi.rejectProductRecommendations({
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
      priceExperimentationApi.completeExperiment({
        universeId: variables.universeId,
        experimentId: variables.experimentId,
      }),
    retry: mutationRetry,
  });

  const { mutateAsync: startHoldout } = useMutation({
    mutationFn: async (variables: ExperimentVariables) =>
      priceExperimentationApi.startHoldout({
        universeId: variables.universeId,
        experimentId: variables.experimentId,
      }),
    retry: mutationRetry,
  });

  const { mutateAsync: restorePricesAndCompleteRaw } = useMutation({
    mutationFn: async (variables: ExperimentVariables) =>
      priceExperimentationApi.restorePrices({
        universeId: variables.universeId,
        experimentId: variables.experimentId,
      }),
    retry: mutationRetry,
  });

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

      invalidateProductQueries(queryClient, universeId);
    },
    [acceptRecommendations, rejectRecommendations, markExperimentCompleteRaw, queryClient],
  );

  const markExperimentComplete = useCallback(
    async (universeId: number, experimentId: string) => {
      await markExperimentCompleteRaw({ universeId, experimentId });

      invalidateProductQueries(queryClient, universeId);
    },
    [markExperimentCompleteRaw, queryClient],
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

      invalidateProductQueries(queryClient, universeId);
    },
    [acceptRecommendations, startHoldout, queryClient],
  );

  const restorePricesAndComplete = useCallback(
    async (universeId: number, experimentId: string) => {
      await restorePricesAndCompleteRaw({ universeId, experimentId });
      void queryClient.invalidateQueries({
        queryKey: [rootQueryKey, universeId, currentExperimentQueryKey],
      });
      invalidateProductQueries(queryClient, universeId);
    },
    [restorePricesAndCompleteRaw, queryClient],
  );

  const refetchData = useCallback(
    (universeId: number) => {
      // Invalidate queries to trigger refetching all the data for universe, experiments, products, etc.
      invalidateProductQueries(queryClient, universeId);
      void queryClient.invalidateQueries({
        queryKey: [rootQueryKey, universeId],
      });
    },
    [queryClient],
  );

  return {
    completeExperiment,
    completeExperimentAndStartHoldout,
    refetchData,
    markExperimentComplete,
    restorePricesAndComplete,
  };
}

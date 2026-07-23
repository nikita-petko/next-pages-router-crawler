import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import priceExperimentationApi from '@modules/clients/priceExperimentation';
import { ProductDetails } from '@rbx/clients/priceExperimentationApi/v1';
import { mutationLimit, rootQueryKey } from './constants';
import { useInvalidateProducts } from './useGetProducts';

// Have to define these types since useMutation only passes in one parameter
// to the mutationFn, so we pass in a single object.
// Don't need such a type for createExperiment since it only takes in one parameter already
type AddProductsToExperimentVariables = {
  universeId: number;
  experimentId: string;
  products: ProductDetails[];
};

type StartExperimentVariables = {
  universeId: number;
  experimentId: string;
};

type Options = {
  onError?: (error: Error) => void;
};

export default function useCreateExperiment(options: Options = {}) {
  const queryClient = useQueryClient();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { mutateAsync: createExperiment } = useMutation({
    mutationFn: async (experimentUniverseId: number) =>
      priceExperimentationApi.priceExperimentationApiCreateExperiment({
        universeId: experimentUniverseId,
      }),
    retry: 1,
    ...options,
  });

  const { mutateAsync: addProducts } = useMutation({
    mutationFn: async (variables: AddProductsToExperimentVariables) =>
      priceExperimentationApi.priceExperimentationApiAddProductsToExperiment({
        universeId: variables.universeId,
        experimentId: variables.experimentId,
        priceExperimentationApiAddProductsToExperimentRequest: {
          products: variables.products,
        },
      }),
    // Each individual addProducts call is retried once
    retry: 1,
    ...options,
  });

  const { mutateAsync: startExperiment } = useMutation({
    mutationFn: async (variables: StartExperimentVariables) =>
      priceExperimentationApi.priceExperimentationApiStartExperiment({
        universeId: variables.universeId,
        experimentId: variables.experimentId,
      }),
    retry: 1,
    ...options,
  });

  const invalidateProductQueries = useInvalidateProducts();

  const createAndStartExperiment = useCallback(
    async (universeId: number, products: ProductDetails[]) => {
      setIsLoading(true);
      const { experimentId } = await createExperiment(universeId);

      // Split into batches
      const productBatches: ProductDetails[][] = [];
      for (let i = 0; i < products.length; i += mutationLimit) {
        productBatches.push(products.slice(i, Math.min(i + mutationLimit, products.length)));
      }

      await Promise.all(
        productBatches.map((batch) => addProducts({ universeId, experimentId, products: batch })),
      );

      await startExperiment({ universeId, experimentId });

      // Invalidate queries to trigger refetching all the data for universe, experiments, products, etc.
      invalidateProductQueries(universeId);
      queryClient.invalidateQueries({
        queryKey: [rootQueryKey, universeId],
      });

      setIsLoading(false);
    },
    [createExperiment, startExperiment, queryClient, addProducts, invalidateProductQueries],
  );

  return { createAndStartExperiment, isLoading } as const;
}

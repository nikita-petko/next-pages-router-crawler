import { useQuery } from '@tanstack/react-query';
import priceExperimentationApi from '@modules/clients/priceExperimentation';
import { ProductDetails } from '@rbx/clients/priceExperimentationApi/v1';
import {
  getProductTransactionVolumesQueryKey,
  rootQueryKey,
  readBatchSize,
  transactionVolumeStaleTime,
} from './constants';
import useGetLatestExperiment from './useGetLatestExperiment';
import useGetProducts from './useGetProducts';
import { isOngoingExperiment } from '../helpers/experimentUtils';

export default function useGetProductTransactionVolumes() {
  const { universeId, latestExperiment } = useGetLatestExperiment();
  const { products } = useGetProducts();

  const {
    data: productTransactionVolumes,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [rootQueryKey, universeId, getProductTransactionVolumesQueryKey, products],
    queryFn: async () => {
      const productBatches: ProductDetails[][] = [];
      for (let i = 0; i < products.length; i += readBatchSize) {
        productBatches.push(products.slice(i, Math.min(i + readBatchSize, products.length)));
      }

      const result = await Promise.all(
        productBatches.map((batch) =>
          priceExperimentationApi.priceExperimentationApiGetProductTransactionVolumes({
            universeId: universeId!,
            priceExperimentationApiGetProductTransactionVolumesRequest: {
              products: batch,
            },
          }),
        ),
      );

      const transactionVolumes = result.map((tvResponse) => tvResponse.transactionVolumes).flat();
      return transactionVolumes;
    },
    refetchInterval: () =>
      isOngoingExperiment(latestExperiment?.state) ? false : transactionVolumeStaleTime,
    staleTime: transactionVolumeStaleTime,
  });

  return { productTransactionVolumes: productTransactionVolumes ?? [], isLoading, isError };
}

import priceExperimentationApi from '@modules/clients/priceExperimentation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { currentExperimentQueryKey, mutationRetry, rootQueryKey } from './constants';
import { useInvalidateProducts } from './useGetProducts';

type StopHoldoutVariables = {
  universeId: number;
  experimentId: string;
  restorePrices: boolean;
};

export default function useStopHoldout() {
  const queryClient = useQueryClient();

  const { mutateAsync } = useMutation({
    mutationFn: async (variables: StopHoldoutVariables) =>
      priceExperimentationApi.priceExperimentationApiStopHoldout({
        universeId: variables.universeId,
        experimentId: variables.experimentId,
        priceExperimentationApiStopHoldoutRequest: {
          restorePrices: variables.restorePrices,
        },
      }),
    retry: mutationRetry,
  });

  const invalidateProductQueries = useInvalidateProducts();

  const stopHoldout = async (universeId: number, experimentId: string, restorePrices: boolean) => {
    await mutateAsync({ universeId, experimentId, restorePrices });
    queryClient.invalidateQueries({
      queryKey: [rootQueryKey, universeId, currentExperimentQueryKey],
    });
    invalidateProductQueries(universeId);
  };

  return { stopHoldout };
}

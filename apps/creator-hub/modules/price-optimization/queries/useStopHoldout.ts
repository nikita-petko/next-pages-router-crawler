import { useMutation } from '@tanstack/react-query';
import priceExperimentationApi from '@modules/clients/priceExperimentation';
import { currentExperimentQueryKey, mutationRetry, rootQueryKey } from './constants';
import { invalidateProductQueries } from './useGetProducts';

type StopHoldoutVariables = {
  universeId: number;
  experimentId: string;
  restorePrices: boolean;
};

export function useStopHoldout() {
  const { mutateAsync } = useMutation({
    mutationFn: async (variables: StopHoldoutVariables) =>
      priceExperimentationApi.stopHoldout({
        universeId: variables.universeId,
        experimentId: variables.experimentId,
        priceExperimentationApiStopHoldoutRequest: {
          restorePrices: variables.restorePrices,
        },
      }),
    retry: mutationRetry,
    onSettled: (data, error, variables, onSettledResult, context) => {
      void context.client.invalidateQueries({
        queryKey: [rootQueryKey, variables.universeId, currentExperimentQueryKey],
      });

      invalidateProductQueries(context.client, variables.universeId);
    },
  });

  return { stopHoldout: mutateAsync };
}

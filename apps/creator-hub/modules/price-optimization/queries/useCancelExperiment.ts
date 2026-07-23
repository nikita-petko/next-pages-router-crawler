import { useMutation } from '@tanstack/react-query';
import type { PriceExperimentationApiCancelExperimentRequest } from '@rbx/client-price-experimentation-api/v1';
import priceExperimentationApi from '@modules/clients/priceExperimentation';
import { mutationRetry, rootQueryKey } from './constants';
import { invalidateProductQueries } from './useGetProducts';

export function useCancelExperiment() {
  const { mutateAsync } = useMutation({
    mutationFn: async (variables: PriceExperimentationApiCancelExperimentRequest) =>
      priceExperimentationApi.cancelExperiment(variables),
    retry: mutationRetry,
    onSettled: (data, error, variables, onSettledResult, context) => {
      void context.client.invalidateQueries({
        queryKey: [rootQueryKey, variables.universeId],
      });
      invalidateProductQueries(context.client, variables.universeId);
    },
  });

  return { cancelExperiment: mutateAsync };
}

import priceExperimentationApi from '@modules/clients/priceExperimentation';
import { PriceExperimentationApiCancelExperimentRequest } from '@rbx/clients/priceExperimentationApi/v1';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mutationRetry } from './constants';

export default function useCancelExperiment() {
  const queryClient = useQueryClient();

  const { mutateAsync } = useMutation({
    mutationFn: async (variables: PriceExperimentationApiCancelExperimentRequest) =>
      priceExperimentationApi.priceExperimentationApiCancelExperiment(variables),
    retry: mutationRetry,
    onSettled: () => queryClient.invalidateQueries(),
  });

  const cancelExperiment = async (universeId: number, experimentId: string) => {
    await mutateAsync({ universeId, experimentId });
  };

  return { cancelExperiment };
}

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import type { StopHoldoutResponse } from '@rbx/client-price-experimentation-api/v1';
import priceExperimentationApi from '@modules/clients/priceExperimentation';

type MutationVariables = {
  universeId: number;
  experimentId: string;
};

type Options = Omit<
  UseMutationOptions<StopHoldoutResponse, Error, MutationVariables>,
  'mutationFn'
>;

export function useStopHoldout(options?: Options) {
  return useMutation({
    mutationFn: ({ universeId, experimentId }: MutationVariables) =>
      priceExperimentationApi.stopHoldout({ universeId, experimentId }),
    ...options,
  });
}

/* istanbul ignore file */
import passesClient from '@modules/clients/passes';
import type { GamePassesUpdateGamePassRequest } from '@rbx/clients/gamePassesHttpService/v1';
import { useMutation, type UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { DEFAULT_RETRIES, gamePassKeys } from './constants';

type UseUpdateGamePassParams = {
  universeId: number;
  gamePassId: number;
};

type MutationVariables = Omit<GamePassesUpdateGamePassRequest, 'universeId' | 'gamePassId'>;

type Options = Omit<UseMutationOptions<void, Error, MutationVariables>, 'mutationFn'>;

export function useUpdateGamePass(params: UseUpdateGamePassParams, options: Options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: gamePassKeys.update(params.universeId, params.gamePassId),
    mutationFn: (variables: MutationVariables) =>
      passesClient.updateGamePass({
        universeId: params.universeId,
        gamePassId: params.gamePassId,
        ...variables,
      }),
    retry: DEFAULT_RETRIES,
    ...options,
    onSettled: (data, error, variables, onSettledResult, context) => {
      queryClient.invalidateQueries({ queryKey: gamePassKeys.all(params.universeId) });
      queryClient.invalidateQueries({
        queryKey: gamePassKeys.config(params.universeId, params.gamePassId),
      });
      options.onSettled?.(data, error, variables, onSettledResult, context);
    },
  });
}

export type UpdateGamePassRequest = MutationVariables;

export default useUpdateGamePass;

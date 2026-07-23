/* istanbul ignore file */
import passesClient from '@modules/clients/passes';
import { useMutation, type UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import type {
  GamePassesCreateGamePassRequest,
  GamePassConfigV2,
} from '@rbx/clients/gamePassesHttpService/v1';
import { DEFAULT_RETRIES, gamePassKeys } from './constants';

type UseCreateGamePassParams = {
  universeId: number;
};

type MutationVariables = Omit<GamePassesCreateGamePassRequest, 'universeId'>;

type Options = Omit<UseMutationOptions<GamePassConfigV2, Error, MutationVariables>, 'mutationFn'>;

export function useCreateGamePass(params: UseCreateGamePassParams, options: Options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: gamePassKeys.create(params.universeId),
    mutationFn: (variables: MutationVariables) =>
      passesClient.createGamePass({
        universeId: params.universeId,
        ...variables,
      }),
    retry: DEFAULT_RETRIES,
    ...options,
    onSettled: (data, error, variables, onSettledResult, context) => {
      queryClient.invalidateQueries({
        queryKey: gamePassKeys.all(params.universeId),
      });

      options.onSettled?.(data, error, variables, onSettledResult, context);
    },
  });
}

export type CreateGamePassRequest = MutationVariables;

export default useCreateGamePass;

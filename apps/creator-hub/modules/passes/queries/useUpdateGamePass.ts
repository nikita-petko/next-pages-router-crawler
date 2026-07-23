import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import type { GamePassesUpdateGamePassRequest } from '@rbx/client-game-passes-http-service/v1';
import passesClient from '@modules/clients/passes';
import { shopsKeys } from '@modules/shops/queries/constants';
import { DEFAULT_RETRIES, gamePassKeys } from './constants';

type UseUpdateGamePassParams = {
  universeId: number;
  gamePassId: number;
  shopId?: number;
};

type MutationVariables = Omit<GamePassesUpdateGamePassRequest, 'universeId' | 'gamePassId'>;

type Options = Omit<UseMutationOptions<void, Error, MutationVariables>, 'mutationFn'>;

export function useUpdateGamePass(
  params: UseUpdateGamePassParams,
  { onSuccess, onSettled, ...options }: Options = {},
) {
  return useMutation({
    mutationKey: gamePassKeys.update(params.universeId, params.gamePassId),
    mutationFn: (variables: MutationVariables) =>
      passesClient.updateGamePass({
        universeId: params.universeId,
        gamePassId: params.gamePassId,
        ...variables,
      }),
    retry: DEFAULT_RETRIES,
    onSuccess: (data, variables, onMutateResult, context) => {
      // Refresh the personalized shop's item list so the updated product shows up.
      if (params.shopId !== undefined) {
        void context.client.invalidateQueries({ queryKey: shopsKeys.itemsByShop(params.shopId) });
      }

      onSuccess?.(data, variables, onMutateResult, context);
    },
    onSettled: (data, error, variables, onSettledResult, context) => {
      void context.client.invalidateQueries({ queryKey: gamePassKeys.all(params.universeId) });
      void context.client.invalidateQueries({
        queryKey: gamePassKeys.config(params.universeId, params.gamePassId),
      });
      onSettled?.(data, error, variables, onSettledResult, context);
    },
    ...options,
  });
}

export type UpdateGamePassRequest = MutationVariables;

/* istanbul ignore file */
import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import type {
  GamePassesCreateGamePassRequest,
  GamePassConfigV2,
} from '@rbx/client-game-passes-http-service/v1';
import passesClient from '@modules/clients/passes';
import { shopsKeys } from '@modules/shops/queries/constants';
import { DEFAULT_RETRIES, gamePassKeys } from './constants';

type UseCreateGamePassParams = {
  universeId: number;
  shopId?: number;
};

type MutationVariables = Omit<GamePassesCreateGamePassRequest, 'universeId'>;

type Options = Omit<UseMutationOptions<GamePassConfigV2, Error, MutationVariables>, 'mutationFn'>;

export function useCreateGamePass(
  params: UseCreateGamePassParams,
  { onSuccess, onSettled, ...options }: Options = {},
) {
  return useMutation({
    mutationKey: gamePassKeys.create(params.universeId),
    mutationFn: (variables: MutationVariables) =>
      passesClient.createGamePass({
        universeId: params.universeId,
        ...variables,
      }),
    retry: DEFAULT_RETRIES,
    onSuccess: (data, variables, onMutateResult, context) => {
      // Refresh the personalized shop's item list so the newly created product shows up.
      if (params.shopId !== undefined) {
        void context.client.invalidateQueries({ queryKey: shopsKeys.itemsByShop(params.shopId) });
      }

      onSuccess?.(data, variables, onMutateResult, context);
    },
    onSettled: (data, error, variables, onSettledResult, context) => {
      void context.client.invalidateQueries({
        queryKey: gamePassKeys.all(params.universeId),
      });

      onSettled?.(data, error, variables, onSettledResult, context);
    },
    ...options,
  });
}

export type CreateGamePassRequest = MutationVariables;

/* istanbul ignore file */
import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import paymentsBonusServiceClient, { GamePassProductType } from '@modules/clients/bonusItem';
import { gamePassKeys } from '@modules/passes/queries/constants';
import { DEFAULT_RETRIES } from './constants';

type UseUpdateGamePassBonusOptInParams = {
  universeId: number;
  gamePassId: number;
};

type MutationVariables = {
  isOptedIn: boolean;
};

type Options = Omit<UseMutationOptions<boolean, Error, MutationVariables>, 'mutationFn'>;

export function useUpdateGamePassBonusOptIn(
  { universeId, gamePassId }: UseUpdateGamePassBonusOptInParams,
  options: Options = {},
) {
  return useMutation({
    mutationFn: async (variables: MutationVariables) => {
      await paymentsBonusServiceClient.updateOptInStatus({
        paymentsBonusServiceCreateOrUpdateBonusOptInStatusRequest: {
          virtualPurchasingProductTargetId: gamePassId,
          virtualPurchasingProductType: GamePassProductType,
          isOptedIn: variables.isOptedIn,
        },
      });
      return true;
    },
    retry: DEFAULT_RETRIES,
    ...options,
    onSettled: (data, error, variables, onSettledResult, context) => {
      void context.client.invalidateQueries({
        queryKey: gamePassKeys.bonusOptIn(universeId, gamePassId),
      });
      options.onSettled?.(data, error, variables, onSettledResult, context);
    },
  });
}

export default useUpdateGamePassBonusOptIn;

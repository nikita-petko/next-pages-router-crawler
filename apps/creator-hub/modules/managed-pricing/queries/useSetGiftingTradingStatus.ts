import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import developerProductsClient from '@modules/clients/developerProducts';
import { managedPricingKeys } from './constants';

type MutationVariables = {
  universeId: number;
  hasGiftingTrading: boolean;
};

type Options = Omit<
  UseMutationOptions<boolean, Error, MutationVariables>,
  'mutationFn' | 'mutationKey'
>;

export function useSetGiftingTradingStatus(options: Options = {}) {
  return useMutation({
    mutationFn: async (variables) => {
      await developerProductsClient.setGiftingTradingStatus({
        universeId: variables.universeId,
        hasGiftingTrading: variables.hasGiftingTrading,
      });
      return true;
    },
    onSettled: (data, error, variables, onSettledResult, context) => {
      // Invalidate the gifting trading status query to refetch the updated status
      void context.client.invalidateQueries({
        queryKey: managedPricingKeys.giftingTradingStatus(variables.universeId),
      });

      options.onSettled?.(data, error, variables, onSettledResult, context);
    },
    ...options,
  });
}

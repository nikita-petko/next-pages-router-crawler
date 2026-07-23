import developerProductsClient from '@modules/clients/developerProducts';
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './constants';

type MutationVariables = {
  universeId: number;
  hasGiftingTrading: boolean;
};

type Options = Omit<
  UseMutationOptions<boolean, Error, MutationVariables>,
  'mutationFn' | 'mutationKey'
>;

export function useSetGiftingTradingStatus(options: Options = {}) {
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({
        queryKey: queryKeys.giftingTradingStatus(variables.universeId),
      });

      options.onSettled?.(data, error, variables, onSettledResult, context);
    },
    ...options,
  });
}

export default useSetGiftingTradingStatus;

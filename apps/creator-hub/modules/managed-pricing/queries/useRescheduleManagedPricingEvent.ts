import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import priceConfigurationApi from '@modules/clients/priceConfigurationApi';
import { useMonetizationFlags } from '@modules/monetization-shared/flags/useMonetizationFlags';
import { managedPricingEventKeys } from './constants';

type MutationVariables = {
  universeId: number;
  eventId: string;
  newStartTime: Date;
};

type Options = Omit<UseMutationOptions<void, Error, MutationVariables>, 'mutationFn'>;

const DEFAULT_RETRIES = 0;

async function rescheduleManagedPricingEvent(params: {
  universeId: number;
  eventId: string;
  newStartTime: Date;
  mock?: boolean;
}) {
  if (params.mock) {
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
    return;
  }

  await priceConfigurationApi.rescheduleManagedPricingEvent(params.universeId, params.eventId, {
    newStartTime: params.newStartTime,
  });
}

export function useRescheduleManagedPricingEvent(options: Options = {}) {
  const { mockManagedPricingEvents } = useMonetizationFlags('mockManagedPricingEvents');

  return useMutation({
    mutationFn: ({ universeId, eventId, newStartTime }: MutationVariables) =>
      rescheduleManagedPricingEvent({
        universeId,
        eventId,
        newStartTime,
        mock: mockManagedPricingEvents ?? false,
      }),
    retry: DEFAULT_RETRIES,
    ...options,
    onSuccess: async (data, variables, onMutateResult, context) => {
      await context.client.invalidateQueries({
        queryKey: managedPricingEventKeys.all(variables.universeId),
      });
      await options.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}

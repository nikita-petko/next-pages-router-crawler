import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import priceConfigurationApi from '@modules/clients/priceConfigurationApi';
import { useMonetizationFlags } from '@modules/monetization-shared/flags/useMonetizationFlags';
import { MOCK_PRICING_EVENTS } from '../mocks';
import type { ManagedPricingEvent } from '../types';
import { parseManagedPricingEvent } from '../utils/parseManagedPricingEvent';
import { managedPricingEventKeys } from './constants';

export type UseGetManagedPricingEventParams = {
  universeId?: number;
  eventId?: string;
};

type Options<TData = ManagedPricingEvent> = Omit<
  UseQueryOptions<ManagedPricingEvent, Error, TData>,
  'queryKey' | 'queryFn'
>;

async function getManagedPricingEvent(params: {
  universeId: number;
  eventId: string;
  mock?: boolean;
  signal?: AbortSignal;
}) {
  if (params.mock) {
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
    const event = MOCK_PRICING_EVENTS.find((e) => e.id === params.eventId);
    if (!event) {
      throw new Error('Event not found');
    }
    return event;
  }

  const repsonse = await priceConfigurationApi.getManagedPricingEvent(
    params.universeId,
    params.eventId,
    { signal: params.signal },
  );
  return parseManagedPricingEvent(repsonse);
}

export function useGetManagedPricingEvent(
  { universeId, eventId }: UseGetManagedPricingEventParams,
  options: Options = {},
) {
  const { mockManagedPricingEvents } = useMonetizationFlags('mockManagedPricingEvents');

  // oxlint-disable typescript/no-non-null-assertion -- guaranteed with enabled
  return useQuery({
    queryKey: managedPricingEventKeys.event(universeId!, eventId!, {
      mock: mockManagedPricingEvents ?? false,
    }),
    queryFn: ({ signal }) =>
      getManagedPricingEvent({
        universeId: universeId!,
        eventId: eventId!,
        mock: mockManagedPricingEvents ?? false,
        signal,
      }),
    ...options,
    enabled: !!universeId && universeId > 0 && !!eventId && (options.enabled ?? true),
  });
}

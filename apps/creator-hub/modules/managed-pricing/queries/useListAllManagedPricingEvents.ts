import { queryOptions, useQuery, type UseQueryOptions } from '@tanstack/react-query';
import priceConfigurationApi from '@modules/clients/priceConfigurationApi';
import { useMonetizationFlags } from '@modules/monetization-shared/flags/useMonetizationFlags';
import { MOCK_PRICING_EVENTS } from '../mocks';
import type { ManagedPricingEvent } from '../types';
import { parseManagedPricingEvent } from '../utils/parseManagedPricingEvent';
import { DEFAULT_RETRIES, DEFAULT_STALE_TIME, managedPricingEventKeys } from './constants';

type Options<TData = ManagedPricingEvent[]> = Omit<
  UseQueryOptions<ManagedPricingEvent[], Error, TData>,
  'queryKey' | 'queryFn'
> & {
  pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 100;

async function listAllManagedPricingEvents(
  universeId: number,
  { pageSize = DEFAULT_PAGE_SIZE, mock }: { pageSize?: number; mock?: boolean },
): Promise<ManagedPricingEvent[]> {
  if (mock) {
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
    return MOCK_PRICING_EVENTS.slice(0, pageSize);
  }

  let response = await priceConfigurationApi.listManagedPricingEventsByUniverse(universeId, {
    pageSize,
  });

  let events = response.events.map(parseManagedPricingEvent);
  while (response.nextPageToken) {
    response = await priceConfigurationApi.listManagedPricingEventsByUniverse(universeId, {
      pageSize,
      pageToken: response.nextPageToken,
    });
    events = events.concat(response.events.map(parseManagedPricingEvent));
  }

  return events;
}

function listAllManagedPricingEventsQueryOptions<TData = ManagedPricingEvent[]>(
  params: { universeId: number; pageSize?: number; mock?: boolean },
  options?: Options<TData>,
) {
  const { universeId, pageSize, mock } = params;
  return queryOptions<ManagedPricingEvent[], Error, TData>({
    queryKey: managedPricingEventKeys.listAll(universeId, { pageSize, mock }),
    queryFn: () => listAllManagedPricingEvents(universeId, { pageSize, mock }),
    staleTime: DEFAULT_STALE_TIME,
    retry: DEFAULT_RETRIES,
    ...options,
  });
}

/** General query hook for listing all managed pricing events for a universe. */
export function useListAllManagedPricingEvents<TData = ManagedPricingEvent[]>(
  universeId: number,
  { pageSize, ...options }: Options<TData> = {},
) {
  const { mockManagedPricingEvents } = useMonetizationFlags('mockManagedPricingEvents');
  return useQuery(
    listAllManagedPricingEventsQueryOptions(
      { universeId, pageSize, mock: mockManagedPricingEvents ?? false },
      options,
    ),
  );
}

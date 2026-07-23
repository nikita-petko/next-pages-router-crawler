import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { GetManagedPricingSummaryResponse } from '@rbx/client-price-configuration-api/v1';
import priceConfigurationApi from '@modules/clients/priceConfigurationApi';
import { useMonetizationFlags } from '@modules/monetization-shared/flags/useMonetizationFlags';
import { MOCK_PRICING_EVENTS } from '../mocks';
import { DEFAULT_RETRIES, managedPricingKeys } from './constants';

type Options<TData = GetManagedPricingSummaryResponse> = Omit<
  UseQueryOptions<GetManagedPricingSummaryResponse, Error, TData>,
  'queryKey' | 'queryFn'
>;

const STALE_TIME_MS = 60 * 60 * 1000; // 1 hour - this should not change frequently

async function getManagedPricingSummary(params: {
  universeId: number;
  mock?: boolean;
  signal?: AbortSignal;
}): Promise<GetManagedPricingSummaryResponse> {
  /* istanbul ignore if -- dev-only mock branch gated behind a feature flag */
  if (params.mock) {
    await new Promise((resolve) => {
      setTimeout(resolve, 500);
    });

    const current =
      MOCK_PRICING_EVENTS.find((e) => e.status === 'Upcoming') ??
      MOCK_PRICING_EVENTS.find((e) => e.status === 'Active') ??
      null;
    const previous = MOCK_PRICING_EVENTS.find((e) => e.status === 'Completed') ?? null;

    return {
      productCounts: null, // Always defer to local count
      managedPricingImpact: {
        revenueLiftRobux: 102000,
        revenueLiftPercentage: 8.3,
        regionalizedPayerRate: 0.234,
        regionalizedPayerRateLift: 0.131,
      },
      experimentOverview: {
        currentEvent: current
          ? {
              id: current.id,
              status: current.status,
              startTime: current.startTime ?? new Date(),
              endTime: current.endTime,
              totalProductCount: current.totalProductCount,
            }
          : null,
        previousEvent: previous ?? null,
      },
    } as const satisfies GetManagedPricingSummaryResponse;
  }

  return priceConfigurationApi.getManagedPricingSummary(params.universeId, {
    signal: params.signal,
  });
}

export function useGetManagedPricingSummary<TData = GetManagedPricingSummaryResponse>(
  universeId: number,
  options: Options<TData> = {},
) {
  const { mockManagedPricingSummary } = useMonetizationFlags('mockManagedPricingSummary');
  return useQuery({
    queryKey: managedPricingKeys.managedPricingSummary(universeId, {
      mock: mockManagedPricingSummary ?? false,
    }),
    queryFn: ({ signal }) =>
      getManagedPricingSummary({ universeId, mock: mockManagedPricingSummary ?? false, signal }),
    retry: DEFAULT_RETRIES,
    staleTime: STALE_TIME_MS,
    ...options,
  });
}

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { GetExperimentSummaryResponse } from '@rbx/client-price-experimentation-api/v1';
import priceExperimentationApi from '@modules/clients/priceExperimentation';
import { useMonetizationFlags } from '@modules/monetization-shared/flags/useMonetizationFlags';
import { MOCK_PRICING_EVENTS } from '../mocks';
import { managedPricingExperimentKeys } from './constants';

export type UseGetExperimentSummaryParams = {
  universeId?: number;
  experimentId?: string;
};

type Options<TData = GetExperimentSummaryResponse> = Omit<
  UseQueryOptions<GetExperimentSummaryResponse, Error, TData>,
  'queryKey' | 'queryFn'
>;

// Mock breakdown is synthesized from the matching MOCK_PRICING_EVENTS entry's
// counts so the dev experience is deterministic; PCA's mock list does not carry
// an actual breakdown, so we split totalProductCount evenly across the buckets
// and fall back to the legacy 34% test-population stub.
const MOCK_TEST_POPULATION_MICROS = 340_000;

function buildMockSummary(experimentId: string): GetExperimentSummaryResponse {
  const event = MOCK_PRICING_EVENTS.find((e) => e.eventReferenceId === experimentId);
  if (!event) {
    throw new Error('Experiment not found');
  }

  // For non-Completed events PCA mocks have null counts; mirror that with a null
  // breakdown so the UI exercises its empty-state branches.
  if (event.status !== 'Completed') {
    return {
      priceChangeBreakdown: null,
      experimentPopulationInMicroUnits:
        event.status === 'Active' ? MOCK_TEST_POPULATION_MICROS : null,
      revenueLiftInMicroUnits: null,
    };
  }

  const total = event.totalProductCount;
  const updated = event.updatedProductCount;
  const noChange = Math.max(0, total - updated);
  const increased = Math.ceil(updated / 2);
  const decreased = updated - increased;

  return {
    priceChangeBreakdown: { increased, decreased, noChange },
    experimentPopulationInMicroUnits: MOCK_TEST_POPULATION_MICROS,
    revenueLiftInMicroUnits: event.revenueLiftMicros,
  };
}

async function getExperimentSummary(params: {
  universeId: number;
  experimentId: string;
  mock?: boolean;
  signal?: AbortSignal;
}): Promise<GetExperimentSummaryResponse> {
  if (params.mock) {
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
    return buildMockSummary(params.experimentId);
  }

  return priceExperimentationApi.getExperimentSummary(
    { universeId: params.universeId, experimentId: params.experimentId },
    { signal: params.signal },
  );
}

export function useGetExperimentSummary(
  { universeId, experimentId }: UseGetExperimentSummaryParams,
  options: Options = {},
) {
  const { mockManagedPricingEvents } = useMonetizationFlags('mockManagedPricingEvents');

  // oxlint-disable typescript/no-non-null-assertion -- guaranteed with enabled
  return useQuery({
    queryKey: managedPricingExperimentKeys.summary(universeId!, experimentId!, {
      mock: mockManagedPricingEvents ?? false,
    }),
    queryFn: ({ signal }) =>
      getExperimentSummary({
        universeId: universeId!,
        experimentId: experimentId!,
        mock: mockManagedPricingEvents ?? false,
        signal,
      }),
    ...options,
    enabled: !!universeId && universeId > 0 && !!experimentId && (options.enabled ?? true),
  });
}

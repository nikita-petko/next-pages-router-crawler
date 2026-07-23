/* istanbul ignore file */
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { MOCK_PRICING_EVENTS } from '../pricing-activity/mocks';
import { ManagedPricingEvent } from '../pricing-activity/types';
import { queryKeys } from './constants';

export type UseExperimentSummaryParams = {
  universeId?: number;
  experimentId?: string;
};

type Options<TData = ManagedPricingEvent> = Omit<
  UseQueryOptions<ManagedPricingEvent, Error, TData>,
  'queryKey' | 'queryFn'
>;

// Mocking this for now
export function useGetExperimentSummary(
  { universeId, experimentId }: UseExperimentSummaryParams,
  options: Options = {},
) {
  return useQuery({
    queryKey: queryKeys.experimentSummary(universeId!, experimentId!),
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const experiment = MOCK_PRICING_EVENTS.find((event) => event.externalId === experimentId);
      if (!experiment) {
        throw new Error('Experiment not found');
      }
      return experiment;
    },
    ...options,
    enabled: !!universeId && !!experimentId && (options.enabled ?? true),
  });
}

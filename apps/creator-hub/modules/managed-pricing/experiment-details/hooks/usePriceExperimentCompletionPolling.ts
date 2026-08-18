import { useGetExperimentSummary } from '../../queries/useGetExperimentSummary';
import { useGetManagedPricingEvent } from '../../queries/useGetManagedPricingEvent';

type Params = {
  universeId: number;
  eventId: string;
  experimentId: string;
};

const POLLING_INTERVAL_MS = 2_000;

/**
 * Polls the experiment and event summary to determine if the experiment is complete.
 */
export function usePriceExperimentCompletionPolling({ universeId, eventId, experimentId }: Params) {
  const { data: experiment } = useGetExperimentSummary(
    { universeId, experimentId },
    { refetchInterval: POLLING_INTERVAL_MS, refetchIntervalInBackground: true },
  );
  const { data: event } = useGetManagedPricingEvent(
    { universeId, eventId },
    { refetchInterval: POLLING_INTERVAL_MS, refetchIntervalInBackground: true },
  );

  const isExperimentComplete = experiment?.state === 'Completed';
  const isEventComplete = event?.status === 'Completed';

  return { isComplete: isExperimentComplete && isEventComplete };
}

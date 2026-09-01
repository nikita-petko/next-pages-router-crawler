import { isOngoingExperiment } from '../helpers/experimentUtils';
import { useGetLatestExperiment } from './useGetLatestExperiment';

/**
 * External query hook to see if the current experience has an active price optimization experiment.
 */
export function useIsPriceOptimizationActive(universeId?: number) {
  const {
    latestExperiment: currentExperiment,
    isLoading: isLoadingExperiment,
    isError: isErrorExperiment,
  } = useGetLatestExperiment({ universeId });

  return {
    isPriceOptimizationActive: isOngoingExperiment(currentExperiment?.state),
    isLoading: isLoadingExperiment,
    isError: isErrorExperiment,
  } as const;
}

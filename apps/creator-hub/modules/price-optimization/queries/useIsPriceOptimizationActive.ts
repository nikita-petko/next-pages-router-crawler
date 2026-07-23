import useGetLatestExperiment from './useGetLatestExperiment';
import useGetPriceExperimentationEligibility from './useGetPriceExperimentationEligibility';
import { isOngoingExperiment } from '../helpers/experimentUtils';

/**
 * External query hook to see if the current experience has an active price optimization experiment.
 */
export default function useIsPriceOptimizationActive() {
  const { isEligible, isInitialLoading: isLoadingEligibility } =
    useGetPriceExperimentationEligibility();

  // Get latest experiment to check if price optimization is active
  const {
    latestExperiment: currentExperiment,
    isInitialLoading: isLoadingExperiment,
    isError: isErrorExperiment,
  } = useGetLatestExperiment({ enabled: isEligible });

  const isLoading = (isLoadingExperiment && isEligible) || isLoadingEligibility;

  const isError = isErrorExperiment;

  const isPriceOptimizationActive = isOngoingExperiment(currentExperiment?.state);

  return {
    isEligible,
    isPriceOptimizationActive,
    isLoading,
    isError,
  } as const;
}

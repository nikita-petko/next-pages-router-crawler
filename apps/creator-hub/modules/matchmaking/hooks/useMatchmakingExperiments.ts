import { useContext } from 'react';
import type { MatchmakingExperimentsContextValue } from '../providers/MatchmakingExperimentsContext';
import MatchmakingExperimentsContext from '../providers/MatchmakingExperimentsContext';

/**
 * Hook to access matchmaking experiments data from the MatchmakingExperimentsProvider
 *
 * @returns MatchmakingExperimentsContextValue containing:
 *  - activeExperiment: The active experiment (running takes priority over scheduled, null if none)
 *  - isLoadingActiveExperiment: Loading state for active experiment data
 *  - fetchActiveExperimentError: Error object for active experiment fetch (null if no error)
 *  - isLoadingCompletedExperiments: Loading state for completed experiments data
 *  - fetchCompletedExperimentsError: Error object for completed experiments fetch (null if no error)
 *  - showExperimentNudge: Whether to show the experiment nudge UI
 *  - currentConfigurationDraftExperiment: Experiment that references the current configuration (Draft only)
 *  - isLoadingCurrentConfigurationDraftExperiment: Loading state for current configuration draft experiment
 *  - fetchCurrentConfigurationDraftExperimentError: Error object for current configuration draft experiment fetch
 */
const useMatchmakingExperiments = (): MatchmakingExperimentsContextValue => {
  const context = useContext(MatchmakingExperimentsContext);

  if (context === undefined) {
    throw new Error(
      'useMatchmakingExperiments must be used within a MatchmakingExperimentsProvider',
    );
  }

  return context;
};

export default useMatchmakingExperiments;

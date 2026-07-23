import { createContext } from 'react';
import type { ValidExperiment } from '@modules/remote-configs/api/validExperimentationTypes';

export interface MatchmakingExperimentsContextValue {
  activeExperiment: ValidExperiment | null;

  isLoadingActiveExperiment: boolean;
  fetchActiveExperimentError: Error | null;

  isLoadingCompletedExperiments: boolean;
  fetchCompletedExperimentsError: Error | null;

  showExperimentNudge: boolean;

  // Experiment for the current configuration (Draft/Running/Scheduled only)
  currentConfigurationDraftExperiment: ValidExperiment | null;
  isLoadingCurrentConfigurationDraftExperiment: boolean;
  fetchCurrentConfigurationDraftExperimentError: Error | null;
}

const defaultContextValue: MatchmakingExperimentsContextValue = {
  activeExperiment: null,
  isLoadingActiveExperiment: false,
  fetchActiveExperimentError: null,
  isLoadingCompletedExperiments: false,
  fetchCompletedExperimentsError: null,
  showExperimentNudge: false,
  currentConfigurationDraftExperiment: null,
  isLoadingCurrentConfigurationDraftExperiment: false,
  fetchCurrentConfigurationDraftExperimentError: null,
};

const MatchmakingExperimentsContext =
  createContext<MatchmakingExperimentsContextValue>(defaultContextValue);

export default MatchmakingExperimentsContext;

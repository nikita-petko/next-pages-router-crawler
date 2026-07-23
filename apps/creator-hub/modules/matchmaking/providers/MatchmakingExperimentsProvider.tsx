import React, { FunctionComponent, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useCreatorExperimentationClient } from '@modules/remote-configs/CreatorExperimentationClientProvider';
import {
  ExperimentState,
  SortKey,
  SortOrder,
  ExperimentProductType,
} from '@modules/remote-configs/api/universeExperimentationClientEnums';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import MatchmakingExperimentsContext, {
  MatchmakingExperimentsContextValue,
} from './MatchmakingExperimentsContext';
import useConfigurationManagement from '../hooks/useConfigurationManagement';

const MATCHMAKING_EXPERIMENTS_QUERY_KEY_PREFIX = 'get-matchmaking-exps-list';
const MATCHMAKING_EXPEIRMENT_DETAIL_QUERY_KEY_PREFIX = 'get-matchmaking-exp-details';
const DRAFT_MATCHMAKING_EXPEIRMENTS_CURRENT_CONFIGURATION_DRAFT_QUERY_KEY_PREFIX =
  'get-draft-matchmaking-exps-for-current-config';
const DEFAULT_PAGE_SIZE = 50; // Large enough to get most recent running + scheduled experiments in one pagination

// Query key generators for different experiment queries
// Using these helpers ensures consistent query keys and avoids caching conflicts
const getMatchmakingExperimentsQueryKey = (universeId: number, type: 'active' | 'completed') => [
  MATCHMAKING_EXPERIMENTS_QUERY_KEY_PREFIX,
  universeId,
  type,
];

const getConfigurationDraftExperimentsQueryKey = (universeId: number, configurationId: string) => [
  DRAFT_MATCHMAKING_EXPEIRMENTS_CURRENT_CONFIGURATION_DRAFT_QUERY_KEY_PREFIX,
  universeId,
  configurationId,
];

const getExperimentDetailsQueryKey = (universeId: number, experimentId: string) => [
  MATCHMAKING_EXPEIRMENT_DETAIL_QUERY_KEY_PREFIX,
  universeId,
  experimentId,
];

interface MatchmakingExperimentsProviderProps {
  children: React.ReactNode;
}

const MatchmakingExperimentsProvider: FunctionComponent<MatchmakingExperimentsProviderProps> = ({
  children,
}) => {
  const { gameDetails } = useCurrentGame();
  const client = useCreatorExperimentationClient();
  const { isMatchmakingCustomizationExperimentsAllowed } = useFeatureFlagsForNamespace(
    ['isMatchmakingCustomizationExperimentsAllowed'],
    FeatureFlagNamespace.Matchmaking,
  );
  const { currentConfigurationDetailedInfo } = useConfigurationManagement();

  const universeId = useMemo(() => {
    return gameDetails?.id;
  }, [gameDetails]);

  const currentConfigurationId = useMemo(() => {
    return currentConfigurationDetailedInfo?.id;
  }, [currentConfigurationDetailedInfo]);

  // fetch active experiments
  const {
    data: fetchActiveExperimentsData,
    status: fetchActiveExperimentsQueryStatus,
    error: fetchActiveExperimentsError,
  } = useQuery({
    queryKey: getMatchmakingExperimentsQueryKey(universeId!, 'active'),
    queryFn: () => {
      return client.v1UniversesUniverseIdExperimentsGet({
        universeId: universeId!,
        paramsSkip: 0,
        paramsMaxPageSize: DEFAULT_PAGE_SIZE,
        // active experiments statuses
        paramsStateFilters: [ExperimentState.Running, ExperimentState.Scheduled],
        paramsSortKey: SortKey.StartTime,
        paramsSortOrder: SortOrder.Ascending,
        paramsProductTypeFilter: ExperimentProductType.Matchmaking,
      });
    },
    enabled: !!universeId && isMatchmakingCustomizationExperimentsAllowed,
  });

  // fetch completed experiments
  const {
    data: fetchCompletedExperimentsData,
    status: fetchCompletedExperimentsQueryStatus,
    error: fetchCompletedExperimentsError,
  } = useQuery({
    queryKey: getMatchmakingExperimentsQueryKey(universeId!, 'completed'),
    queryFn: () => {
      return client.v1UniversesUniverseIdExperimentsGet({
        universeId: universeId!,
        paramsSkip: 0,
        paramsMaxPageSize: DEFAULT_PAGE_SIZE,
        paramsStateFilters: [ExperimentState.Completed],
        paramsProductTypeFilter: ExperimentProductType.Matchmaking,
      });
    },
    enabled: !!universeId && isMatchmakingCustomizationExperimentsAllowed,
  });

  const hasCompletedExperiments = useMemo(() => {
    const probedCompletedExperimentsCount =
      fetchCompletedExperimentsData?.experimentsSummary?.length ?? 0;
    return probedCompletedExperimentsCount > 0;
  }, [fetchCompletedExperimentsData?.experimentsSummary]);

  // Fetch experiments that last modified referenced the current configuration (Draft only)
  const {
    data: fetchCurrentConfigurationDraftExperimentsData,
    status: fetchCurrentConfigurationDraftExperimentsQueryStatus,
    error: fetchCurrentConfigurationDraftExperimentsError,
  } = useQuery({
    queryKey: getConfigurationDraftExperimentsQueryKey(universeId!, currentConfigurationId!),
    queryFn: () => {
      return client.v1UniversesUniverseIdExperimentsGet({
        universeId: universeId!,
        paramsSkip: 0,
        paramsMaxPageSize: 1, // Only need the first result
        // Filter by Draft
        paramsStateFilters: [ExperimentState.Draft],
        paramsSortKey: SortKey.LastModifiedTime,
        paramsSortOrder: SortOrder.Descending,
        paramsProductTypeFilter: ExperimentProductType.Matchmaking,
        paramsSearchKey: currentConfigurationId!, // Search by configuration ID
      });
    },
    enabled:
      !!universeId && !!currentConfigurationId && isMatchmakingCustomizationExperimentsAllowed,
  });

  const currentConfigurationDraftExperimentSummary = useMemo(() => {
    if (!fetchCurrentConfigurationDraftExperimentsData?.experimentsSummary) return null;
    if (fetchCurrentConfigurationDraftExperimentsData.experimentsSummary.length === 0) return null;
    return fetchCurrentConfigurationDraftExperimentsData.experimentsSummary[0];
  }, [fetchCurrentConfigurationDraftExperimentsData?.experimentsSummary]);

  const currentConfigurationDraftExperimentId = useMemo(() => {
    return currentConfigurationDraftExperimentSummary?.id || null;
  }, [currentConfigurationDraftExperimentSummary]);

  // get active experiment ID from sorted summary list by index 0 if any
  // ordered by start time in ascending order, so running experiment should be
  // at index 0 if any, otherwise the most recent upcoming scheduled experiment should be
  // at index 0
  const activeExperimentId = useMemo(() => {
    if (!fetchActiveExperimentsData?.experimentsSummary) return null;

    if (fetchActiveExperimentsData.experimentsSummary.length > 0) {
      return fetchActiveExperimentsData.experimentsSummary[0].id;
    }

    return null;
  }, [fetchActiveExperimentsData?.experimentsSummary]);

  // Fetch full experiment details if we have an active experiment
  const {
    data: activeExperimentData,
    status: fetchActiveExperimentDetailsQueryStatus,
    error: fetchActiveExperimentDetailsError,
  } = useQuery({
    queryKey: getExperimentDetailsQueryKey(universeId!, activeExperimentId!),
    queryFn: () =>
      client.v1UniversesUniverseIdExperimentExperimentIdGet({
        universeId: universeId!,
        experimentId: activeExperimentId!,
      }),
    enabled: !!activeExperimentId && !!universeId && isMatchmakingCustomizationExperimentsAllowed,
  });

  const activeExperiment = useMemo(() => {
    return activeExperimentData?.experiment || null;
  }, [activeExperimentData?.experiment]);

  // Fetch full experiment details for current configuration draft experiment
  const {
    data: currentConfigurationDraftExperimentDetailsData,
    status: fetchCurrentConfigurationDraftExperimentDetailsQueryStatus,
    error: fetchCurrentConfigurationDraftExperimentDetailsError,
  } = useQuery({
    queryKey: getExperimentDetailsQueryKey(universeId!, currentConfigurationDraftExperimentId!),
    queryFn: () =>
      client.v1UniversesUniverseIdExperimentExperimentIdGet({
        universeId: universeId!,
        experimentId: currentConfigurationDraftExperimentId!,
      }),
    enabled:
      !!currentConfigurationDraftExperimentId &&
      !!universeId &&
      isMatchmakingCustomizationExperimentsAllowed,
  });

  const currentConfigurationDraftExperiment = useMemo(() => {
    return currentConfigurationDraftExperimentDetailsData?.experiment || null;
  }, [currentConfigurationDraftExperimentDetailsData?.experiment]);

  const contextValue: MatchmakingExperimentsContextValue = useMemo(() => {
    // If feature flag is disabled, return default state
    if (!isMatchmakingCustomizationExperimentsAllowed) {
      return {
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
    }

    return {
      activeExperiment: activeExperiment || null,
      isLoadingActiveExperiment:
        fetchActiveExperimentsQueryStatus === 'pending' ||
        (!!activeExperimentId && fetchActiveExperimentDetailsQueryStatus === 'pending'),
      fetchActiveExperimentError: fetchActiveExperimentsError || fetchActiveExperimentDetailsError,
      isLoadingCompletedExperiments: fetchCompletedExperimentsQueryStatus === 'pending',
      fetchCompletedExperimentsError,
      // show experiment nudge if there are no completed experiments and the active
      // experiment is scheduled only, or if there are no active experiments
      showExperimentNudge:
        !hasCompletedExperiments &&
        (!activeExperiment || activeExperiment.state === ExperimentState.Scheduled),
      currentConfigurationDraftExperiment: currentConfigurationDraftExperiment || null,
      isLoadingCurrentConfigurationDraftExperiment:
        fetchCurrentConfigurationDraftExperimentsQueryStatus === 'pending' ||
        (!!currentConfigurationDraftExperimentId &&
          fetchCurrentConfigurationDraftExperimentDetailsQueryStatus === 'pending'),
      fetchCurrentConfigurationDraftExperimentError:
        fetchCurrentConfigurationDraftExperimentsError ||
        fetchCurrentConfigurationDraftExperimentDetailsError,
    };
  }, [
    isMatchmakingCustomizationExperimentsAllowed,
    activeExperiment,
    activeExperimentId,
    fetchActiveExperimentsQueryStatus,
    fetchActiveExperimentDetailsQueryStatus,
    fetchActiveExperimentsError,
    fetchActiveExperimentDetailsError,
    fetchCompletedExperimentsQueryStatus,
    fetchCompletedExperimentsError,
    hasCompletedExperiments,
    currentConfigurationDraftExperiment,
    currentConfigurationDraftExperimentId,
    fetchCurrentConfigurationDraftExperimentsQueryStatus,
    fetchCurrentConfigurationDraftExperimentDetailsQueryStatus,
    fetchCurrentConfigurationDraftExperimentsError,
    fetchCurrentConfigurationDraftExperimentDetailsError,
  ]);

  return (
    <MatchmakingExperimentsContext.Provider value={contextValue}>
      {children}
    </MatchmakingExperimentsContext.Provider>
  );
};

export default MatchmakingExperimentsProvider;

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExperimentState } from '@rbx/client-price-experimentation-api/v1';
import priceExperimentationApi from '@modules/clients/priceExperimentation';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { isExperimentPolling } from '../helpers/experimentUtils';
import {
  currentExperimentQueryKey,
  lastCompletedExperimentQueryKey,
  pollingInterval,
  queryRetry,
  rootQueryKey,
  staleTime,
} from './constants';

type Parameters = {
  completed?: boolean;
  enabled?: boolean;
};

export function useGetLatestExperiment({ completed = false, enabled = true }: Parameters = {}) {
  const { gameDetails } = useCurrentGame();
  const universeId = gameDetails && gameDetails.id ? gameDetails.id : undefined;

  const queryKey = useMemo(
    () => [
      rootQueryKey,
      universeId,
      completed ? lastCompletedExperimentQueryKey : currentExperimentQueryKey,
    ],
    [universeId, completed],
  );

  const { data, isPending, isLoading, isError } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await priceExperimentationApi.listExperiments({
        // Query is only enabled when universeId is defined
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- guarded by enabled
        universeId: universeId as number,
        state: completed ? ExperimentState.Completed : undefined,
        limit: 1,
      });
      if (response.data.length === 0) {
        return null;
      }
      return response.data[0];
    },
    refetchInterval: ({ state }) => {
      const experiment = state.data;
      // Poll and refetch for certain holdout completion states
      if (isExperimentPolling(experiment?.state)) {
        return pollingInterval;
      }
      return false;
    },
    enabled: !!universeId && enabled,
    staleTime,
    retry: queryRetry,
    refetchOnWindowFocus: true,
  });

  return {
    universeId,
    latestExperiment: data,
    isLoading: isPending || !universeId,
    isInitialLoading: isLoading, // Keeping v4 interface until later refactor
    isError,
  } as const;
}

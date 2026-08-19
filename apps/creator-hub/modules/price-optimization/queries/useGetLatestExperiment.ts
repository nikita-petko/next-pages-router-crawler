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
  universeId?: number;
  completed?: boolean;
  enabled?: boolean;
};

export function useGetLatestExperiment({
  universeId,
  completed = false,
  enabled = true,
}: Parameters = {}) {
  const { gameDetails } = useCurrentGame();
  const gameUniverseId = gameDetails && gameDetails.id ? gameDetails.id : undefined;

  const queryKey = useMemo(
    () => [
      rootQueryKey,
      universeId ?? gameUniverseId,
      completed ? lastCompletedExperimentQueryKey : currentExperimentQueryKey,
    ],
    [universeId, gameUniverseId, completed],
  );

  const { data, isPending, isLoading, isError } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await priceExperimentationApi.listExperiments({
        // Query is only enabled when universeId is defined
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- guarded by enabled
        universeId: universeId ?? (gameUniverseId as number),
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
    enabled: !!(universeId ?? gameUniverseId) && enabled,
    staleTime,
    retry: queryRetry,
    refetchOnWindowFocus: true,
  });

  return {
    universeId: universeId ?? gameUniverseId,
    latestExperiment: data,
    isLoading: isPending || !(universeId ?? gameUniverseId),
    isInitialLoading: isLoading, // Keeping v4 interface until later refactor
    isError,
  } as const;
}

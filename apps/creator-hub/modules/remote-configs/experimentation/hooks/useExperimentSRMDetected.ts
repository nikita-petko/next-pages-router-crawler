import { useUniverseResource } from '@modules/experience-analytics-shared';
import { useCreatorExperimentationClient } from '@modules/remote-configs/CreatorExperimentationClientProvider';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const interval = 2000; // 2 seconds
const maxAttempts = 20;

const useExperimentSRMDetected = (experimentId: string) => {
  const { id: universeId, isLoading: isUniverseLoading } = useUniverseResource();
  const client = useCreatorExperimentationClient();

  const fetchStats = useCallback(
    () =>
      client.v1UniversesUniverseIdExperimentExperimentIdStatsGet({
        universeId,
        experimentId,
      }),
    [client, universeId, experimentId],
  );

  const pollStats = useCallback(async () => {
    let response = await fetchStats();

    let attempts = 1;
    while (!response.done) {
      if (attempts > maxAttempts) {
        throw new Error('Error: reached out max number of attempts');
      }

      await sleep(interval); // eslint-disable-line no-await-in-loop -- sleep in between requests to provide time for the op to resolve
      response = await fetchStats(); // eslint-disable-line no-await-in-loop -- make requests serially until one succeeds

      attempts += 1;
    }

    if (response.isError) {
      throw response.error;
    }

    return response.experimentStats;
  }, [fetchStats]);

  const { data, isPending } = useQuery({
    queryKey: ['experiment-srm-detected', experimentId, universeId],
    queryFn: pollStats,
    enabled: !isUniverseLoading,
  });

  return useMemo(
    () => ({
      isSRMDetected: data?.isSrmDetected ?? false,
      isLoading: isPending,
    }),
    [data?.isSrmDetected, isPending],
  );
};

export default useExperimentSRMDetected;

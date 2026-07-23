import { getResponseFromError } from '@modules/clients/utils';
import { useUniverseResource } from '@modules/experience-analytics-shared';
import { useCreatorExperimentationClient } from '@modules/remote-configs/CreatorExperimentationClientProvider';
import { StatusCodes } from '@rbx/core';
import { QueryClient, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
// Use a shorter interval in test environment for faster tests
const interval = process.env.NODE_ENV === 'test' ? 0 : 2000; // 2 seconds in production, instant in tests
const maxAttempts = 20;

const getExperimentVariantsResultsQueryKey = (experimentId: string, universeId: number) => [
  'experiment-variants-results',
  experimentId,
  universeId,
];

export const refreshExperimentVariantsResults = ({
  experimentId,
  universeId,
  queryClient,
}: {
  experimentId: string;
  universeId: number;
  queryClient: QueryClient;
}) => {
  queryClient.invalidateQueries({
    queryKey: getExperimentVariantsResultsQueryKey(experimentId, universeId),
  });
};

const useExperimentVariantsResults = (experimentId: string) => {
  const { id: universeId, isLoading: isUniverseLoading } = useUniverseResource();
  const client = useCreatorExperimentationClient();

  const fetchExperimentVariantsResults = useCallback(
    () =>
      client.v1UniversesUniverseIdExperimentExperimentIdResultsGet({
        universeId,
        experimentId,
      }),
    [client, universeId, experimentId],
  );

  const pollExperimentVariantsResults = useCallback(async () => {
    let response = await fetchExperimentVariantsResults();

    let attempts = 1;
    while (!response.done) {
      if (attempts > maxAttempts) {
        throw new Error('Error: reached out max number of attempts');
      }

      await sleep(interval); // eslint-disable-line no-await-in-loop -- sleep in between requests to provide time for the op to resolve
      response = await fetchExperimentVariantsResults(); // eslint-disable-line no-await-in-loop -- make requests serially until one succeeds

      attempts += 1;
    }

    if (response.isError) {
      throw response.error;
    }

    return response.experimentResults;
  }, [fetchExperimentVariantsResults]);

  const retry = useCallback((failureCount: number, error: Error) => {
    return failureCount < 3 && getResponseFromError(error)?.status !== StatusCodes.FORBIDDEN;
  }, []);

  const { data, isPending, error } = useQuery({
    queryKey: getExperimentVariantsResultsQueryKey(experimentId, universeId),
    queryFn: pollExperimentVariantsResults,
    enabled: !isUniverseLoading,
    retry,
  });

  return useMemo(
    () => ({
      experimentVariantsResults: data,
      isLoading: isPending,
      error,
    }),
    [data, isPending, error],
  );
};

export default useExperimentVariantsResults;

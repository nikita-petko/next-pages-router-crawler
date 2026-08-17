import { useCallback, useMemo } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { StatusCodes } from '@rbx/core';
import { getResponseFromError } from '@modules/clients/utils';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { ExperimentResultsSource } from '../../api/universeExperimentationClientEnums';
import { useCreatorExperimentationClient } from '../../CreatorExperimentationClientProvider';

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
// Use a shorter interval in test environment for faster tests
const interval = process.env.NODE_ENV === 'test' ? 0 : 2000; // 2 seconds in production, instant in tests
const maxAttempts = 20;

const getExperimentVariantsResultsQueryKey = (
  experimentId: string,
  universeId: number,
  resultsSource: ExperimentResultsSource,
) => ['experiment-variants-results', experimentId, universeId, resultsSource];

export const refreshExperimentVariantsResults = ({
  experimentId,
  universeId,
  queryClient,
}: {
  experimentId: string;
  universeId: number;
  queryClient: QueryClient;
}) => {
  void queryClient.invalidateQueries({
    queryKey: ['experiment-variants-results', experimentId, universeId],
  });
};

const useExperimentVariantsResultsFromSource = ({
  experimentId,
  resultsSource,
  disabled = false,
}: {
  experimentId: string;
  resultsSource: ExperimentResultsSource;
  disabled?: boolean;
}) => {
  const { id: universeId, isLoading: isUniverseLoading } = useUniverseResource();
  const client = useCreatorExperimentationClient();

  const fetchExperimentVariantsResults = useCallback(
    () =>
      client.v1UniversesUniverseIdExperimentExperimentIdResultsGet({
        universeId,
        experimentId,
        resultsSource,
      }),
    [client, universeId, experimentId, resultsSource],
  );

  const pollExperimentVariantsResults = useCallback(async () => {
    let response = await fetchExperimentVariantsResults();

    let attempts = 1;
    while (!response.done) {
      if (attempts > maxAttempts) {
        throw new Error('Error: reached out max number of attempts');
      }

      await sleep(interval);
      response = await fetchExperimentVariantsResults();

      attempts += 1;
    }

    if (response.isError) {
      // oxlint-disable-next-line typescript/only-throw-error
      throw response.error;
    }

    return response.experimentResults;
  }, [fetchExperimentVariantsResults]);

  const retry = useCallback((failureCount: number, error: Error) => {
    return failureCount < 3 && getResponseFromError(error)?.status !== StatusCodes.FORBIDDEN;
  }, []);

  const { data, isPending, error } = useQuery({
    queryKey: getExperimentVariantsResultsQueryKey(experimentId, universeId, resultsSource),
    queryFn: pollExperimentVariantsResults,
    enabled: !disabled && !isUniverseLoading,
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

/**
 * Get ExperimentVariantResults
 * @param resultsSource - Primary ResultsSource to fetch results from
 * @param fallbackResultsSource - Secondary ResultsSource to fetech from.
 *        Only invoked if primary request **succeeds** with empty results
 */
const useExperimentVariantsResults = ({
  experimentId,
  resultsSource = ExperimentResultsSource.Batch,
  fallbackResultsSource,
  disabled = false,
}: {
  experimentId: string;
  resultsSource?: ExperimentResultsSource;
  fallbackResultsSource?: ExperimentResultsSource;
  disabled?: boolean;
}) => {
  const primary = useExperimentVariantsResultsFromSource({
    experimentId,
    resultsSource,
    disabled,
  });

  const shouldUseFallback =
    fallbackResultsSource !== undefined &&
    fallbackResultsSource !== resultsSource &&
    !primary.isLoading &&
    !primary.error &&
    primary.experimentVariantsResults?.variantResults.size === 0;

  const fallback = useExperimentVariantsResultsFromSource({
    experimentId,
    resultsSource: fallbackResultsSource ?? resultsSource,
    disabled: disabled || !shouldUseFallback,
  });

  return useMemo(
    () => ({
      experimentVariantsResults:
        shouldUseFallback && fallback.experimentVariantsResults
          ? fallback.experimentVariantsResults
          : primary.experimentVariantsResults,
      isLoading: primary.isLoading || (shouldUseFallback && fallback.isLoading),
      error: primary.error,
    }),
    [fallback, primary, shouldUseFallback],
  );
};

export default useExperimentVariantsResults;

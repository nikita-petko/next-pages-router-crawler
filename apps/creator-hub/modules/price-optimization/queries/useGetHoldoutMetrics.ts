import priceExperimentationApi from '@modules/clients/priceExperimentation';
import { useCallback, useMemo } from 'react';
import { ListExperimentMetricsResponse } from '@rbx/clients/priceExperimentationApi/v1';
import { getHoldoutMetricsQueryKey, paginationLimit, queryRetry, rootQueryKey } from './constants';
import useGetLatestExperiment from './useGetLatestExperiment';
import usePagedQueryAll from './usePagedQueryAll';
import { isInHoldoutResultsState } from '../helpers/experimentUtils';

export default function useGetHoldoutMetrics() {
  const {
    universeId,
    latestExperiment: currentExperiment,
    isLoading: isCurrentExperimentLoading,
    isError: isCurrentExperimentError,
  } = useGetLatestExperiment();

  const experimentHasMetrics = isInHoldoutResultsState(currentExperiment?.state);
  const dependenciesLoaded = !isCurrentExperimentLoading && !isCurrentExperimentError;

  const queryKey = useMemo(
    () => [rootQueryKey, universeId, getHoldoutMetricsQueryKey],
    [universeId],
  );

  const pageMapper = useCallback((page: ListExperimentMetricsResponse) => page.data, []);

  const { data, isLoading, isError } = usePagedQueryAll(
    {
      queryKey,
      queryFn: ({ pageParam }) =>
        priceExperimentationApi.priceExperimentationApiListHoldoutMetrics({
          universeId: universeId!,
          experimentId: currentExperiment!.id,
          limit: paginationLimit,
          cursor: pageParam,
        }),
      // Catch all falsy values as no more pages
      getNextPageParam: (lastPage) => lastPage.nextPageCursor,
      retry: queryRetry,
      staleTime: Infinity,
      enabled: dependenciesLoaded && experimentHasMetrics,
      initialPageParam: '',
    },
    pageMapper,
  );

  return {
    metrics: data,
    isLoading,
    isError,
  };
}

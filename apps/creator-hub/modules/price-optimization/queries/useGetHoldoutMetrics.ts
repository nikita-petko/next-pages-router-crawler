import { useCallback, useMemo } from 'react';
import type { ListExperimentMetricsResponse } from '@rbx/client-price-experimentation-api/v1';
import priceExperimentationApi from '@modules/clients/priceExperimentation';
import { isInHoldoutResultsState } from '../helpers/experimentUtils';
import { getHoldoutMetricsQueryKey, paginationLimit, queryRetry, rootQueryKey } from './constants';
import { useGetLatestExperiment } from './useGetLatestExperiment';
import { usePagedQueryAll } from './usePagedQueryAll';

export function useGetHoldoutMetrics() {
  const {
    universeId,
    latestExperiment: currentExperiment,
    isLoading: isCurrentExperimentLoading,
    isError: isCurrentExperimentError,
  } = useGetLatestExperiment();

  const experimentHasMetrics = isInHoldoutResultsState(currentExperiment?.state);
  const dependenciesLoaded = !isCurrentExperimentLoading && !isCurrentExperimentError;

  const queryKey = useMemo(
    () => [rootQueryKey, universeId, getHoldoutMetricsQueryKey, currentExperiment?.id],
    [universeId, currentExperiment?.id],
  );

  const pageMapper = useCallback((page: ListExperimentMetricsResponse) => page.data, []);

  const { data, isLoading, isError } = usePagedQueryAll(
    {
      queryKey,
      // oxlint-disable typescript/no-non-null-assertion -- guarded by enabled
      queryFn: ({ pageParam }) =>
        priceExperimentationApi.listHoldoutMetrics({
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

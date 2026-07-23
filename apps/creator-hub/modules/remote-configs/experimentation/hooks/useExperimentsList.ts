import { QueryClient, useQuery } from '@tanstack/react-query';
import { useUniverseResource } from '@modules/experience-analytics-shared';
import { useEffect, useMemo, useState } from 'react';
import { GenericChartState } from '@modules/charts-generic';
import { getResponseFromError } from '@modules/clients/utils';
import { StatusCodes } from '@rbx/core';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { useCreatorExperimentationClient } from '../../CreatorExperimentationClientProvider';
import useOffsetBasedPaginationState from '../../hooks/useOffsetBasedPaginationState';
import {
  ExperimentProductType,
  ExperimentState,
  SortKey,
  SortOrder,
} from '../../api/universeExperimentationClientEnums';

const emptySummary: never[] = [];
const defaultPageSize = 10;
const EXPERIMENTS_QUERY_KEY_PREFIX = 'get-experiments-list';

const getExperimentsQueryKey = ({
  universeId,
  pageSize,
  skip,
  stateFilters,
  searchKey,
  sort,
  productTypeFilter,
}: {
  universeId: number;
  pageSize: number;
  skip: number;
  stateFilters?: Array<ExperimentState>;
  searchKey?: string;
  sort?: { key: SortKey; order: SortOrder };
  productTypeFilter?: ExperimentProductType;
}) => [
  EXPERIMENTS_QUERY_KEY_PREFIX,
  universeId,
  pageSize,
  skip,
  stateFilters,
  searchKey,
  sort,
  productTypeFilter,
];

export const refreshExperimentsList = async ({
  universeId,
  queryClient,
}: {
  universeId: number;
  queryClient: QueryClient;
}) => {
  return queryClient.invalidateQueries({
    queryKey: [EXPERIMENTS_QUERY_KEY_PREFIX, universeId],
  });
};

const useExperimentsList = ({
  stateFilters,
  searchKey,
  sort,
}: {
  stateFilters?: Array<ExperimentState>;
  searchKey?: string;
  sort?: { key: SortKey; order: SortOrder };
} = {}) => {
  const { id: universeId, isLoading: isUniverseLoading } = useUniverseResource();
  const client = useCreatorExperimentationClient();
  const { isMatchmakingCustomizationAllowed } = useFeatureFlagsForNamespace(
    ['isMatchmakingCustomizationAllowed'],
    FeatureFlagNamespace.Matchmaking,
  );

  // Pagination
  const [total, setTotal] = useState(0);
  const pagination = useOffsetBasedPaginationState({
    total,
    initialPageSize: defaultPageSize,
  });

  // Set the productTypeFilter query param based on feature flag:
  // If the matchmaking experiments flag is OFF, restrict the filter to Configs experiments only.
  // If the matchmaking experiments flag is ON, allow API to return all experiment types (filter undefined).
  // If both flags are OFF, experiment list will be blocked through the enabled query flag below.
  const productTypeFilter = useMemo(() => {
    return !isMatchmakingCustomizationAllowed ? ExperimentProductType.Configs : undefined;
  }, [isMatchmakingCustomizationAllowed]);

  const { data, status, error } = useQuery({
    queryKey: getExperimentsQueryKey({
      universeId,
      pageSize: pagination.pageSize,
      skip: pagination.skip,
      stateFilters,
      searchKey,
      sort,
      productTypeFilter,
    }),
    queryFn: () =>
      client.v1UniversesUniverseIdExperimentsGet({
        universeId,
        paramsSkip: pagination.skip,
        paramsMaxPageSize: pagination.pageSize,
        paramsStateFilters: stateFilters,
        paramsSearchKey: searchKey,
        paramsSortKey: sort?.key,
        paramsSortOrder: sort?.order,
        paramsProductTypeFilter: productTypeFilter,
      }),
    enabled: !isUniverseLoading,
  });
  useEffect(() => {
    if (status === 'success') {
      setTotal(data.total);
    }
  }, [data?.total, status]);

  const experimentsRequestState: GenericChartState = useMemo(
    () => ({
      isDataLoading: status === 'pending',
      isResponseFailed: status === 'error',
      isUserForbidden:
        status === 'error' && getResponseFromError(error)?.status === StatusCodes.FORBIDDEN,
    }),
    [status, error],
  );

  return {
    pagination,
    experimentsSummary: data?.experimentsSummary ?? emptySummary,
    experimentsRequestState,
  };
};

export default useExperimentsList;

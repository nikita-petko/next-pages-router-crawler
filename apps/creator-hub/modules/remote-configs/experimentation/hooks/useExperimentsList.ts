import { useEffect, useMemo, useState } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { StatusCodes } from '@rbx/core';
import type { GenericChartState } from '@modules/charts-generic/charts/types/ChartTypes';
import { getResponseFromError } from '@modules/clients/utils';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import type {
  ExperimentState,
  SortKey,
  SortOrder,
} from '../../api/universeExperimentationClientEnums';
import type { ExperimentProductType } from '../../api/universeExperimentationClientEnums';
import { useCreatorExperimentationClient } from '../../CreatorExperimentationClientProvider';
import useOffsetBasedPaginationState from '../../hooks/useOffsetBasedPaginationState';

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

  // Pagination
  const [total, setTotal] = useState(0);
  const pagination = useOffsetBasedPaginationState({
    total,
    initialPageSize: defaultPageSize,
  });

  const { data, status, error } = useQuery({
    queryKey: getExperimentsQueryKey({
      universeId,
      pageSize: pagination.pageSize,
      skip: pagination.skip,
      stateFilters,
      searchKey,
      sort,
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

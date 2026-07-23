import { useState, useCallback, useMemo, useEffect } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import type { RobloxWebWebAPIModelsApiArrayResponseRobloxUsersApiMultiGetUserResponse } from '@rbx/client-users/v1';
import { StatusCodes } from '@rbx/core';
import type { GenericChartState } from '@modules/charts-generic/charts/types/ChartTypes';
import { useAnalyticsCurrentDateRangeBundle as useExperienceAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic/context/AnalyticsQueryDateRangeBundleContext';
import usersClient from '@modules/clients/users';
import { getResponseFromError } from '@modules/clients/utils';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { SortOrder, SortKey } from '../api/universeConfigsClientEnums';
import type {
  ValidGetConfigurationHistoryResponse,
  ValidSortKey,
  ValidSortOrder,
} from '../api/validTypes';
import type { UsernameDecoratedChangelogEntry } from '../components/history-table/types';
import { useCreatorConfigsClient } from '../CreatorConfigsClientProvider';
import useLatestConfigurations from './useLatestConfigurations';
import useOffsetBasedPaginationState from './useOffsetBasedPaginationState';

const defaultPageSize = 10;
const NOTFOUND_USERNAME = '--';
const EMPTY_ENTRIES: UsernameDecoratedChangelogEntry[] = [];

const CHANGELONG_ENTRIES_QUERY_KEY_PREFIX = 'changelog-entries';
const changelogEntriesQueryKey = (
  universeId: number,
  startDate: Date,
  endDate: Date,
  searchKey: string,
  sort: { key: ValidSortKey; order: ValidSortOrder },
  skip: number,
  pageSize: number,
) => [
  CHANGELONG_ENTRIES_QUERY_KEY_PREFIX,
  universeId,
  startDate,
  endDate,
  searchKey,
  sort.key,
  sort.order,
  skip,
  pageSize,
];

const USER_NAMES_QUERY_KEY_PREFIX = 'user-names';
const userNamesQueryKey = (userIds: number[]) => [USER_NAMES_QUERY_KEY_PREFIX, ...userIds];

const useHistoryPageBundle = () => {
  const queryClient = useQueryClient();
  const { id: universeId, isLoading: isUniverseLoading } = useUniverseResource();
  const { startDate, endDate } = useExperienceAnalyticsCurrentDateRangeBundle();
  const client = useCreatorConfigsClient();
  const { ruleOrdering } = useLatestConfigurations({
    universeId,
    isUniverseLoading,
  });

  // Search key
  const [searchKey, setSearchKey] = useState<string>('');
  const handleSearchChange = useCallback((value: string) => {
    setSearchKey(value);
  }, []);

  // Sort
  const [sort, setSort] = useState<{ key: ValidSortKey; order: ValidSortOrder }>({
    key: SortKey.LastModifiedTime,
    order: SortOrder.Descending,
  });

  // Pagination
  const [total, setTotal] = useState(0);
  const pagination = useOffsetBasedPaginationState({
    total,
    initialPageSize: defaultPageSize,
  });

  // Changelog entries query
  const onSelectForChangelogEntriesQuery = useCallback(
    (response: ValidGetConfigurationHistoryResponse) => {
      return response.getConfigurationHistoryResult;
    },
    [],
  );
  const {
    data: changelogsRequestResult,
    status: changelogsRequestStatus,
    error: changelogsRequestError,
    fetchStatus: changelogsRequestFetchStatus,
  } = useQuery({
    queryKey: changelogEntriesQueryKey(
      universeId,
      startDate,
      endDate,
      searchKey,
      sort,
      pagination.skip,
      pagination.pageSize,
    ),
    queryFn: () =>
      client.v1ChangelogUniversesUniverseIdGet({
        universeId,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        paramsSearchKey: searchKey,
        paramsSortOrder: sort.order,
        paramsSortKey: sort.key,
        paramsSkip: pagination.skip,
        paramsMaxPageSize: pagination.pageSize,
      }),
    enabled: !isUniverseLoading,
    select: onSelectForChangelogEntriesQuery,
    placeholderData: keepPreviousData,
  });
  /* oxlint-disable react/react-compiler -- sync pagination total with changelog query results */
  useEffect(() => {
    if (changelogsRequestStatus === 'success') {
      setTotal(changelogsRequestResult.total);
    }
  }, [changelogsRequestResult?.total, changelogsRequestStatus]);
  /* oxlint-enable react/react-compiler */
  const refreshChangelogs = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: [CHANGELONG_ENTRIES_QUERY_KEY_PREFIX],
    });
  }, [queryClient]);

  // Username query
  const userIds = useMemo(
    () =>
      new Set(changelogsRequestResult?.changelogEntries.map((entry) => entry.publishedBy) ?? []),
    [changelogsRequestResult],
  );
  const onSelectForUserNames = useCallback(
    (response: RobloxWebWebAPIModelsApiArrayResponseRobloxUsersApiMultiGetUserResponse) => {
      return new Map(
        response.data?.map(({ id, displayName }) => [id, displayName ?? NOTFOUND_USERNAME]), // e.g., when user account is deleted
      );
    },
    [],
  );
  /** getUsersByIds will refetch if userIds contains a different set of ids comparing to previous call */
  const { data: userNameById } = useQuery({
    queryKey: userNamesQueryKey(Array.from(userIds)),
    queryFn: () => usersClient.getUsersByIds(Array.from(userIds)),
    enabled: userIds.size > 0,
    select: onSelectForUserNames,
  });

  const usernameDecoratedChangelogEntries: UsernameDecoratedChangelogEntry[] = useMemo(() => {
    return (
      changelogsRequestResult?.changelogEntries.map((entry) => {
        const username = userNameById?.get(entry.publishedBy) ?? NOTFOUND_USERNAME;
        return { ...entry, publishedByUsername: username };
      }) ?? EMPTY_ENTRIES
    );
  }, [changelogsRequestResult?.changelogEntries, userNameById]);

  const changelogsRequestState: GenericChartState = useMemo(
    () => ({
      isDataLoading: changelogsRequestFetchStatus === 'fetching',
      isResponseFailed: changelogsRequestStatus === 'error',
      isUserForbidden:
        changelogsRequestStatus === 'error' &&
        getResponseFromError(changelogsRequestError)?.status === StatusCodes.FORBIDDEN,
    }),
    [changelogsRequestFetchStatus, changelogsRequestError, changelogsRequestStatus],
  );

  return {
    changelogEntries: usernameDecoratedChangelogEntries,
    conditionOrder: ruleOrdering?.conditionOrder,
    refreshChangelogs,
    changelogsRequestState,
    sort,
    setSort,
    searchKey,
    handleSearchChange,
    pagination,
  };
};

export default useHistoryPageBundle;

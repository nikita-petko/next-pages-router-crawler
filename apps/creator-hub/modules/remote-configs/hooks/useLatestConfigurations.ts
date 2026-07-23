import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';
import { V1ConfigurationsUniversesUniverseIdLatestGetRequest } from '@rbx/clients/universeConfigsWebApi';
import { useCreatorConfigsClient } from '../CreatorConfigsClientProvider';
import { useCreatorConfigsSubscriptions } from '../CreatorConfigsRealtimeClientProvider';
import {
  ValidConditionRule,
  ValidConfigEntryDetail,
  ValidGetLatestConfigurationResponse,
  ValidRemoteConfigAPI,
  ValidRuleOrdering,
} from '../api/validTypes';
import {
  transformLatestConfigurationResponse,
  filterAndSortConfigEntries,
} from '../utils/configDataProcessing';
import { SortKey, SortOrder } from '../api/universeConfigsClientEnums';

export type UseLatestConfigurationsOptions = {
  universeId: number;
  isUniverseLoading?: boolean;
  searchKey?: string;
  sortKey?: SortKey;
  sortOrder?: SortOrder;
};

type UseLatestConfigurationsResult = {
  /** entries for current version, transformed, sorted, and filtered */
  entries: ValidConfigEntryDetail[];
  /** rules for current version */
  rules: Map<string, ValidConditionRule>;
  /** rule ordering for current version */
  ruleOrdering?: ValidRuleOrdering;
  /** Whether the query is currently loading */
  isLoading: boolean;
  /** Whether an error occurred */
  isError: boolean;
  /** Function to manually refetch the data */
  refetch: () => Promise<void>;
};

type MostRecentRetrievalRequestVersion = undefined | 'initial' | number;
const getCacheKeys = (universeId: number | undefined) => ({
  mostRecentReceivedData: ['configs-latest-data', universeId], // ValidGetLatestConfigurationResponse
  currentRetrievalRequestVersion: ['configs-latest-retrieval-request-version', universeId], // MostRecentRetrievalRequestVersion
});

const getCachedData = (cacheClient: QueryClient, universeId: number | undefined) => {
  const {
    mostRecentReceivedData: mostRecentReceivedDataKey,
    currentRetrievalRequestVersion: currentRetrievalRequestVersionKey,
  } = getCacheKeys(universeId);
  const mostRecentReceivedData: ValidGetLatestConfigurationResponse | undefined =
    cacheClient.getQueryData<ValidGetLatestConfigurationResponse>(mostRecentReceivedDataKey);
  const currentRetrievalRequestVersion: MostRecentRetrievalRequestVersion | undefined =
    cacheClient.getQueryData<MostRecentRetrievalRequestVersion>(currentRetrievalRequestVersionKey);

  const entries = mostRecentReceivedData
    ? transformLatestConfigurationResponse(mostRecentReceivedData).entries
    : undefined;
  return { mostRecentReceivedData, currentRetrievalRequestVersion, entries };
};

export const getCachedFilteredAndSortedEntries = ({
  queryClient,
  universeId,
  searchKey,
  sortOrder,
  sortKey,
}: {
  queryClient: QueryClient;
  universeId?: number;
  searchKey?: string;
  sortOrder?: SortOrder;
  sortKey?: SortKey;
}) => {
  const { entries } = getCachedData(queryClient, universeId);
  if (!entries) return [];

  // Apply client-side filtering and sorting
  return filterAndSortConfigEntries(entries, {
    searchKey,
    sortOrder,
    sortKey,
  });
};

const buildRequest = (
  cacheClient: QueryClient,
  universeId: number,
): V1ConfigurationsUniversesUniverseIdLatestGetRequest | undefined => {
  const { mostRecentReceivedData: priorResponse, currentRetrievalRequestVersion } = getCachedData(
    cacheClient,
    universeId,
  );
  const { configVersion: priorConfigVersion } = priorResponse ?? {};
  if (currentRetrievalRequestVersion === undefined && priorConfigVersion === undefined) {
    return { universeId };
  }
  if (priorConfigVersion === undefined /* but there is a currentRetrievalRequestVersion */) {
    return undefined; // do not make a request
  }
  return {
    universeId,
    configVersion: priorConfigVersion,
  };
};

const makeRequest = async (
  cacheClient: QueryClient,
  configsClient: ValidRemoteConfigAPI,
  universeId: number | undefined,
  request: V1ConfigurationsUniversesUniverseIdLatestGetRequest | undefined,
) => {
  if (!request) return undefined;

  const version = request.configVersion;
  cacheClient.setQueryData(
    getCacheKeys(universeId).currentRetrievalRequestVersion,
    version ?? 'initial',
  );

  return configsClient.v1ConfigurationsUniversesUniverseIdLatestGet(request);
};

const processResponse = (
  cacheClient: QueryClient,
  universeId: number | undefined,
  response: ValidGetLatestConfigurationResponse | undefined,
) => {
  // Get which version we are currently retrieving and then clear it
  const { mostRecentReceivedData: priorData, currentRetrievalRequestVersion } = getCachedData(
    cacheClient,
    universeId,
  );
  cacheClient.setQueryData(getCacheKeys(universeId).currentRetrievalRequestVersion, undefined);

  if (
    // In the case where there is some prior data
    priorData &&
    // and the response retrieved here is the one we were most recently getting
    response?.configVersion === currentRetrievalRequestVersion &&
    // and the response is empty, meaning no updates
    response?.entries?.length === 0
  ) {
    return priorData;
  }

  return response;
};

const nonSubscriptionRefetchInterval = 30 * 60 * 1000;
const emptyRules = new Map<string, ValidConditionRule>();
const emptyRuleOrdering: ValidRuleOrdering = {
  conditionOrder: [],
};
const emptyEntries: never[] = [];

export const useLatestConfigurations = ({
  universeId,
  isUniverseLoading,
  searchKey,
  sortKey = SortKey.LastModifiedTime,
  sortOrder = SortOrder.Descending,
}: UseLatestConfigurationsOptions): UseLatestConfigurationsResult => {
  const configsClient = useCreatorConfigsClient();
  const queryClient = useQueryClient();

  const request = useMemo(() => buildRequest(queryClient, universeId), [queryClient, universeId]);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['configs-latest-data', universeId],
    queryFn: async ({ client: cacheClient }) => {
      if (!universeId) throw new Error('Should not be enabled without universeId');

      const response = await makeRequest(cacheClient, configsClient, universeId, request);
      return processResponse(queryClient, universeId, response);
    },
    refetchInterval: nonSubscriptionRefetchInterval,
    enabled: !!universeId && !isUniverseLoading && !!request,
  });

  const unsortedEntries = useMemo(
    () => (data ? transformLatestConfigurationResponse(data).entries : []),
    [data],
  );

  const refetch = useCallback(
    (universeIdToRefetch: number) => {
      const { mostRecentReceivedData, currentRetrievalRequestVersion } =
        getCacheKeys(universeIdToRefetch);

      return Promise.all([
        queryClient.invalidateQueries({ queryKey: mostRecentReceivedData }),
        queryClient.invalidateQueries({ queryKey: currentRetrievalRequestVersion }),
      ]);
    },
    [queryClient],
  );

  const { subscribeToConfigUpdates } = useCreatorConfigsSubscriptions();
  useEffect(() => {
    if (!universeId) return () => {};
    const { unsubscribe } = subscribeToConfigUpdates(universeId, () => {
      refetch(universeId);
    });
    return unsubscribe;
  }, [universeId, subscribeToConfigUpdates, queryClient, refetch]);

  return useMemo(() => {
    return {
      entries: unsortedEntries
        ? filterAndSortConfigEntries(unsortedEntries.slice(), { searchKey, sortOrder, sortKey })
        : emptyEntries,
      rules: data?.rules ?? emptyRules,
      ruleOrdering: data?.ruleOrdering ?? emptyRuleOrdering,
      isLoading,
      isError,
      refetch: () => {
        return refetch(universeId).then(() => undefined);
      },
    };
  }, [
    unsortedEntries,
    searchKey,
    sortOrder,
    sortKey,
    data?.rules,
    data?.ruleOrdering,
    isLoading,
    isError,
    refetch,
    universeId,
  ]);
};

export default useLatestConfigurations;

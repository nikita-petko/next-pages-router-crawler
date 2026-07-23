import { useQueryClient } from '@tanstack/react-query';
import type { FC } from 'react';
import React, { useMemo } from 'react';
import type {
  AnalyticsBenchmarkClientWrapper,
  AnalyticsBenchmarkQuery,
} from '@modules/clients/analytics';
import { analyticsBenchmarkClient } from '@modules/clients/analytics';

export const AnalyticsBenchmarkContext = React.createContext<{
  cached: AnalyticsBenchmarkClientWrapper;
  // clearCache: () => void; // NOTE(shumingxu@20241115): unimplemented, see AnalyticsQueryGatewayProvider for example implementation
} | null>(null);

export const useCachedAnalyticsBenchmark = () => {
  const context = React.useContext(AnalyticsBenchmarkContext);
  if (!context) {
    throw new Error(
      'useCachedAnalyticsBenchmark must be used within a CachedAnalyticsBenchmarkProvider',
    );
  }
  const { cached: client } = context;
  return useMemo(() => ({ client }), [client]);
};

const getQueryKey = (request: AnalyticsBenchmarkQuery) => {
  const {
    resourceType,
    resourceId,
    metric,
    startTime,
    endTime,
    filter,
    percentiles,
    benchmarkType,
    ...remainder
  } = request;
  /**
   * NOTE(gperkins@20240819): remainder should be of type {}
   * If it is not, add the new field(s) to the array passed to JSON.stringify
   */
  if (Object.keys(remainder).length > 0) {
    throw new Error(
      `Uncached keys in analytics-benchmark request: ${Object.keys(remainder).join(', ')}`,
    );
  }
  return JSON.stringify([
    resourceType,
    resourceId,
    metric,
    startTime,
    endTime,
    filter,
    percentiles,
    benchmarkType,
  ]);
};

const noStale = { staleTime: Infinity };
const AnalyticsBenchmarkProvider: FC<React.PropsWithChildren> = ({ children }) => {
  const tanstackCache = useQueryClient();
  const cached: AnalyticsBenchmarkClientWrapper = useMemo(() => {
    const query = async (queryRequest: AnalyticsBenchmarkQuery) => {
      const queryKey = ['analytics-benchmark', 'query', getQueryKey(queryRequest)];
      const makeRequest = () => analyticsBenchmarkClient.query(queryRequest);
      return tanstackCache.fetchQuery({
        queryKey,
        queryFn: makeRequest,
        ...noStale,
      });
    };
    return { query };
  }, [tanstackCache]);

  const result = useMemo(() => ({ cached }), [cached]);
  return (
    <AnalyticsBenchmarkContext.Provider value={result}>
      {children}
    </AnalyticsBenchmarkContext.Provider>
  );
};
export default AnalyticsBenchmarkProvider;

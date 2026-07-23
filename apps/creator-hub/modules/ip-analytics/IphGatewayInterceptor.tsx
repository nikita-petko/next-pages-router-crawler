import type { FC } from 'react';
import React, { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RAQIV2WithPollingDefaults } from '@modules/clients/analytics';
import type { AnalyticsQueryGatewayAPIQueryRequest } from '@modules/clients/analytics/analyticsQueryGateway';
import { makeAnalyticsQueryGatewayClient } from '@modules/clients/analytics/analyticsQueryGateway';
import { AnalyticsQueryGatewayContext } from '@modules/experience-analytics-shared/context/AnalyticsQueryGatewayProvider';

const makeIphQueryKey = (request: AnalyticsQueryGatewayAPIQueryRequest) =>
  JSON.stringify([
    'iph-analytics-query-gateway',
    request.resource.type,
    request.metric,
    request.startTime,
    request.endTime,
    request.granularity,
    [...(request.breakdown ?? [])].sort((a, b) => a.localeCompare(b)),
    [...(request.filter ?? [])].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
  ]);

/**
 * Provides a scoped AnalyticsQueryGatewayContext for the IPH earnings page.
 *
 * IPH analytics queries must be isolated from the standard creator analytics cache
 * because the same metrics can be fetched for different resource types (universe vs. IPH entity).
 * This interceptor uses a separate 'iph-aqg' cache key namespace so IPH chart data
 * never collides with or evicts regular experience analytics data.
 *
 * The underlying API instance is the shared analytics-query-gateway singleton —
 * no custom auth or base path is needed.
 */
const IphGatewayInterceptor: FC<React.PropsWithChildren> = ({ children }) => {
  const tanstackCache = useQueryClient();

  const contextValue = useMemo(() => {
    const uncached = makeAnalyticsQueryGatewayClient(RAQIV2WithPollingDefaults);

    const cached = {
      ...uncached,
      query: async (request: AnalyticsQueryGatewayAPIQueryRequest) => {
        const queryKey = ['iph-aqg', makeIphQueryKey(request)];
        return tanstackCache.fetchQuery({
          queryKey,
          queryFn: () => uncached.query(request),
          staleTime: Infinity,
        });
      },
    };

    const clearCache = () => {
      void tanstackCache.resetQueries({ queryKey: ['iph-aqg'] });
    };

    return { uncached, cached, clearCache };
  }, [tanstackCache]);

  return (
    <AnalyticsQueryGatewayContext.Provider value={contextValue}>
      {children}
    </AnalyticsQueryGatewayContext.Provider>
  );
};

export default IphGatewayInterceptor;

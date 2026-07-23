import type { FC } from 'react';
import React, { useMemo } from 'react';
import emptyFunction from '../emptyFunction';
import type { RAQIV2CombinedAPIClientWrapper } from '../utils/makeRAQIV2Request';
import AnalyticsQueryGatewayProvider, {
  useCachedAnalyticsQueryGateway,
  useUncachedAnalyticsQueryGateway,
} from './AnalyticsQueryGatewayProvider';

export const useRAQIV2Client = (
  ignoreCache: boolean,
): { client: RAQIV2CombinedAPIClientWrapper; clearCache: () => void } => {
  const {
    client: platformGatewayRAQIClientCached,
    clearCache: clearCacheForAnalyticsQueryGateway,
  } = useCachedAnalyticsQueryGateway();
  const platformGatewayRAQIClientUncached = useUncachedAnalyticsQueryGateway();
  const platformGatewayRAQIClient = ignoreCache
    ? platformGatewayRAQIClientUncached
    : platformGatewayRAQIClientCached;

  return useMemo(() => {
    const client = { platformGatewayRAQIClient };
    const clearCache = ignoreCache ? clearCacheForAnalyticsQueryGateway : emptyFunction;
    return { client, clearCache };
  }, [platformGatewayRAQIClient, ignoreCache, clearCacheForAnalyticsQueryGateway]);
};

const RAQIV2ClientProvider: FC<React.PropsWithChildren> = ({ children }) => {
  return <AnalyticsQueryGatewayProvider>{children}</AnalyticsQueryGatewayProvider>;
};

export default RAQIV2ClientProvider;

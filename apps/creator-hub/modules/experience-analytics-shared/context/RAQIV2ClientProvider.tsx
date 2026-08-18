import type { FC } from 'react';
import React, { useCallback, useMemo } from 'react';
import emptyFunction from '../emptyFunction';
import type { RAQIV2CombinedAPIClientWrapper } from '../utils/makeRAQIV2Request';
import AnalyticsQueryGatewayProvider, {
  type ClientCacheStatus,
  useCachedAnalyticsQueryGateway,
  useUncachedAnalyticsQueryGateway,
} from './AnalyticsQueryGatewayProvider';

export type RAQIV2ClientCacheTracking = {
  client: RAQIV2CombinedAPIClientWrapper;
  getClientCacheStatus: () => ClientCacheStatus | undefined;
};

export const useRAQIV2Client = (
  ignoreCache: boolean,
): {
  client: RAQIV2CombinedAPIClientWrapper;
  clearCache: () => void;
  createClientCacheTracking: () => RAQIV2ClientCacheTracking;
} => {
  const {
    client: platformGatewayRAQIClientCached,
    clearCache: clearCacheForAnalyticsQueryGateway,
    createCacheTrackedClient,
  } = useCachedAnalyticsQueryGateway();
  const platformGatewayRAQIClientUncached = useUncachedAnalyticsQueryGateway();
  const platformGatewayRAQIClient = ignoreCache
    ? platformGatewayRAQIClientUncached
    : platformGatewayRAQIClientCached;

  const createClientCacheTracking = useCallback((): RAQIV2ClientCacheTracking => {
    if (ignoreCache) {
      return {
        client: {
          platformGatewayRAQIClient: platformGatewayRAQIClientUncached,
        },
        getClientCacheStatus: () => 'disabled',
      };
    }

    const trackedClient = createCacheTrackedClient?.();
    return {
      client: {
        platformGatewayRAQIClient: trackedClient?.client ?? platformGatewayRAQIClientCached,
      },
      getClientCacheStatus: trackedClient?.getClientCacheStatus ?? (() => undefined),
    };
  }, [
    createCacheTrackedClient,
    ignoreCache,
    platformGatewayRAQIClientCached,
    platformGatewayRAQIClientUncached,
  ]);

  return useMemo(() => {
    const client = { platformGatewayRAQIClient };
    const clearCache = ignoreCache ? clearCacheForAnalyticsQueryGateway : emptyFunction;
    return { client, clearCache, createClientCacheTracking };
  }, [
    platformGatewayRAQIClient,
    ignoreCache,
    clearCacheForAnalyticsQueryGateway,
    createClientCacheTracking,
  ]);
};

const RAQIV2ClientProvider: FC<React.PropsWithChildren> = ({ children }) => {
  return <AnalyticsQueryGatewayProvider>{children}</AnalyticsQueryGatewayProvider>;
};

export default RAQIV2ClientProvider;

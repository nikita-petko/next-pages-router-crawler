import type { FunctionComponent } from 'react';
import React, { useContext } from 'react';
import type { DeveloperAnalyticsAggregationsClientWrapper } from '@modules/clients/analytics';
import { developerAnalyticsAggregationsClient } from '@modules/clients/analytics';

export type AnalyticsHomeApiClient = {
  getAnalyticsHomeTabOrder: DeveloperAnalyticsAggregationsClientWrapper['getAnalyticsHomeTabOrder'];
};

export const AnalyticsHomeClientContext = React.createContext<AnalyticsHomeApiClient>(
  developerAnalyticsAggregationsClient,
);
export const useAnalyticsHomeClient = (): AnalyticsHomeApiClient => {
  const client = useContext(AnalyticsHomeClientContext);
  if (client === null) {
    throw new Error('useAnalyticsHomeClient must be used within a AnalyticsHomeClientContext');
  }
  return client;
};

const AnalyticsHomeClientProvider: FunctionComponent<React.PropsWithChildren> = ({ children }) => {
  return (
    <AnalyticsHomeClientContext.Provider value={developerAnalyticsAggregationsClient}>
      {children}
    </AnalyticsHomeClientContext.Provider>
  );
};
export default AnalyticsHomeClientProvider;

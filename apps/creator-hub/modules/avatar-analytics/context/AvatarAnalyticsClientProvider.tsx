import {
  DeveloperAnalyticsAggregationsClientWrapper,
  developerAnalyticsAggregationsClient,
} from '@modules/clients/analytics';
import React, { FunctionComponent, useContext } from 'react';

export type AvatarItemsApiClient = {
  getAvatarItemDetails: DeveloperAnalyticsAggregationsClientWrapper['getAvatarItemDetails'];
  getAvatarItemMetrics: DeveloperAnalyticsAggregationsClientWrapper['getAvatarItemMetrics'];
};

export const AvatarAnalyticsClientContext = React.createContext<AvatarItemsApiClient>(
  developerAnalyticsAggregationsClient,
);
export const useAvatarAnalyticsClient = (): AvatarItemsApiClient => {
  const client = useContext(AvatarAnalyticsClientContext);
  if (client === null) {
    throw new Error('useAvatarAnalyticsClient must be used within a AvatarAnalyticsClientContext');
  }
  return client;
};

const AvatarAnalyticsClientProvider: FunctionComponent<React.PropsWithChildren> = ({
  children,
}) => {
  return (
    <AvatarAnalyticsClientContext.Provider value={developerAnalyticsAggregationsClient}>
      {children}
    </AvatarAnalyticsClientContext.Provider>
  );
};
export default AvatarAnalyticsClientProvider;

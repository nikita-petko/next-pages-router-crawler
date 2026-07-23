import {
  universeAnalyticsInsightsClient,
  UniverseAnalyticsInsightsClient,
} from '@modules/clients/analytics';
import React, { FunctionComponent, useContext } from 'react';

export const UniverseAnalyticsInsightsContext =
  React.createContext<UniverseAnalyticsInsightsClient>(universeAnalyticsInsightsClient);

export const useUniverseAnalyticsInsightsClient = (): UniverseAnalyticsInsightsClient => {
  const client = useContext(UniverseAnalyticsInsightsContext);
  if (client === null) {
    throw new Error(
      'useUniverseAnalyticsInsightsClient must be used within a UniverseAnalyticsInsightsContext',
    );
  }
  return client;
};

const UniverseAnalyticsInsightsClientProvider: FunctionComponent<React.PropsWithChildren> = ({
  children,
}) => {
  return (
    <UniverseAnalyticsInsightsContext.Provider value={universeAnalyticsInsightsClient}>
      {children}
    </UniverseAnalyticsInsightsContext.Provider>
  );
};
export default UniverseAnalyticsInsightsClientProvider;

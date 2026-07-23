import type { FunctionComponent } from 'react';
import React, { useContext } from 'react';
import type { UniverseAnalyticsInsightsClient } from '@modules/clients/analytics';
import { universeAnalyticsInsightsClient } from '@modules/clients/analytics';

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

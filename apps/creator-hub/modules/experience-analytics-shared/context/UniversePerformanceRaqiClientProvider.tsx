import type { FC } from 'react';
import React, { createContext, useContext } from 'react';
import type { UniversePerformanceRaqiClient } from '@modules/clients/analytics/universePerformanceRaqi';
import universePerformanceRaqiClient from '@modules/clients/analytics/universePerformanceRaqi';

type UniversePerformanceRaqiClientProviderState = {
  universePerformanceRaqiClient: UniversePerformanceRaqiClient;
};
const universePerformanceRaqiClientProviderState = { universePerformanceRaqiClient } as const;

export const UniversePerformanceRaqiClientProviderContext =
  createContext<UniversePerformanceRaqiClientProviderState | null>(null);

export const UniversePerformanceRaqiClientProvider: FC<React.PropsWithChildren> = ({
  children,
}) => {
  return (
    <UniversePerformanceRaqiClientProviderContext.Provider
      value={universePerformanceRaqiClientProviderState}>
      {children}
    </UniversePerformanceRaqiClientProviderContext.Provider>
  );
};

export function useUniversePerformanceRaqiClientProvider(): UniversePerformanceRaqiClientProviderState {
  const context = useContext(UniversePerformanceRaqiClientProviderContext);
  if (context === null) {
    throw new Error(
      'useUniversePerformanceRaqiClientProvider must be used within a UniversePerformanceRaqiClientProvider',
    );
  }
  return context;
}

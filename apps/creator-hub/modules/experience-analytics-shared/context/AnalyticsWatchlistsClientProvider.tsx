import type { FC } from 'react';
import React, { createContext, useContext } from 'react';
import type { AnalyticsWatchlistsClient } from '@modules/clients/analytics/analyticsWatchlists';
import analyticsWatchlistsClient from '@modules/clients/analytics/analyticsWatchlists';

type AnalyticsWatchlistsClientProviderState = {
  analyticsWatchlistsClient: AnalyticsWatchlistsClient;
};
const analyticsWatchlistsClientProviderState = { analyticsWatchlistsClient } as const;

export const AnalyticsWatchlistsClientProviderContext =
  createContext<AnalyticsWatchlistsClientProviderState | null>(null);

export const AnalyticsWatchlistsClientProvider: FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <AnalyticsWatchlistsClientProviderContext.Provider
      value={analyticsWatchlistsClientProviderState}>
      {children}
    </AnalyticsWatchlistsClientProviderContext.Provider>
  );
};

export function useAnalyticsWatchlistsClient(): AnalyticsWatchlistsClientProviderState {
  const context = useContext(AnalyticsWatchlistsClientProviderContext);
  if (context === null) {
    throw new Error(
      'useAnalyticsWatchlistsClient must be used within a AnalyticsWatchlistsClientProvider',
    );
  }
  return context;
}

import type { FC } from 'react';
import React, { createContext, useContext, useMemo } from 'react';
import type { TrackerClient } from './tracker';

type EventTrackerProviderState = { trackerClient: Pick<TrackerClient, 'sendEvent'> };

export const EventTrackerProviderContext = createContext<EventTrackerProviderState | null>(null);

export const EventTrackerProvider: FC<
  React.PropsWithChildren<{ trackerClient: Pick<TrackerClient, 'sendEvent'> }>
> = ({ children, trackerClient }) => {
  const eventTrackerProviderState = useMemo(() => {
    return { trackerClient };
  }, [trackerClient]);

  return (
    <EventTrackerProviderContext.Provider value={eventTrackerProviderState}>
      {children}
    </EventTrackerProviderContext.Provider>
  );
};

export function useEventTrackerProvider(): EventTrackerProviderState {
  const context = useContext(EventTrackerProviderContext);
  if (context === null) {
    throw new Error('useEventTrackerProvider must be used within a EventTrackerProvider');
  }
  return context;
}

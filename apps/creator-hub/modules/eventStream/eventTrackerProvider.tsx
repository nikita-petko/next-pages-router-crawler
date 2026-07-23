import React, { createContext, FC, useContext, useMemo } from 'react';
import { TrackerClient } from './tracker';

type EventTrackerProviderState = { trackerClient: TrackerClient };

export const EventTrackerProviderContext = createContext<EventTrackerProviderState | null>(null);

export const EventTrackerProvider: FC<
  React.PropsWithChildren<{ trackerClient: TrackerClient }>
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

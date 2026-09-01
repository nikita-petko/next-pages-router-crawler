import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { VirtualEventDetails } from '@modules/clients/virtualEvents';
import virtualEventsClient from '@modules/clients/virtualEvents';
import EventContext from '../EventContext';
import EventManager from '../utils/EventManager';

const eventManager = new EventManager(virtualEventsClient);

export interface EventProviderProps {
  eventId?: string;
}

const EventProvider: FunctionComponent<React.PropsWithChildren<EventProviderProps>> = ({
  children,
  eventId,
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [eventDetails, setEventDetails] = useState<VirtualEventDetails | null>(null);

  const getEvent = useCallback(async (id: string, isDataRefreshed = false) => {
    const fetchedEventDetails = await eventManager.getEventDetails(id, isDataRefreshed);
    setEventDetails(fetchedEventDetails);
    setIsLoading(false);
  }, []);

  const experienceEventId = useMemo(() => {
    if (eventId) {
      return eventId;
    }

    const { id } = router.query;
    return id as string;
  }, [router.query, eventId]);

  const refreshEventDetails = useCallback(() => {
    if (experienceEventId) {
      return getEvent(experienceEventId, true);
    }
    return Promise.reject(new Error('Cannot refresh event details without an event ID'));
  }, [experienceEventId, getEvent]);

  useEffect(() => {
    try {
      if (experienceEventId) {
        getEvent(experienceEventId);
      }
    } catch {
      // Oh well, the rest of the UX knows what to do
    }
  }, [experienceEventId, getEvent]);

  const eventProviderValue = useMemo(
    () => ({ isLoading, eventDetails, refreshEventDetails }),
    [isLoading, eventDetails, refreshEventDetails],
  );

  return <EventContext.Provider value={eventProviderValue}>{children}</EventContext.Provider>;
};

export default EventProvider;

import type { FC } from 'react';
import { useEffect, useState } from 'react';
import RecommendedEventsLiveEventsApiDataContextProvider from '../../../context/dataProviders/RecommendedEventsLiveEventsApiDataProvider';
import { RecommendedEventsLiveEventsHasEventsApiDataContextProvider } from '../../../context/dataProviders/RecommendedEventsLiveEventsHasEventsApiDataProvider';
import type { RecommendedEventsLiveEventsDialogProps } from './RecommendedEventsLiveEventsTableDialog';
import RecommendedEventsLiveEventsDialog from './RecommendedEventsLiveEventsTableDialog';

const RecommendedEventsLiveEventsDialogContainer: FC<RecommendedEventsLiveEventsDialogProps> = ({
  open,
  onClose,
  defaultEventType,
}) => {
  // Event type is a dialog-internal piece of state seeded from the caller's
  // metric/page-derived `defaultEventType`. The caller owns "what stream is
  // contextually right" (in explore mode that's the metric; on the dedicated
  // Custom/Economy/Funnels pages it's the page domain), and the in-dialog
  // dropdown lets the user pivot streams without leaking the choice into the
  // page URL — which would shadow whatever default the next caller resolves.
  const [eventType, setEventType] = useState(defaultEventType);
  // If the caller's default changes (e.g., the explore-mode metric switches
  // while the dialog is mounted), reset back to the new contextual default
  // so the dialog content matches the surface the user is looking at.
  useEffect(() => {
    setEventType(defaultEventType);
  }, [defaultEventType]);

  return (
    <RecommendedEventsLiveEventsHasEventsApiDataContextProvider>
      <RecommendedEventsLiveEventsApiDataContextProvider eventType={eventType}>
        <RecommendedEventsLiveEventsDialog
          open={open}
          onClose={onClose}
          eventType={eventType}
          onEventTypeChange={setEventType}
        />
      </RecommendedEventsLiveEventsApiDataContextProvider>
    </RecommendedEventsLiveEventsHasEventsApiDataContextProvider>
  );
};

export default RecommendedEventsLiveEventsDialogContainer;

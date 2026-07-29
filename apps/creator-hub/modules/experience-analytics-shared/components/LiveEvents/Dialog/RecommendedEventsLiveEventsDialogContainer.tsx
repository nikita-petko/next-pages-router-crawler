import type { FC } from 'react';
import { useState } from 'react';
import RecommendedEventsLiveEventsApiDataContextProvider from '../../../context/dataProviders/RecommendedEventsLiveEventsApiDataProvider';
import { RecommendedEventsLiveEventsHasEventsApiDataContextProvider } from '../../../context/dataProviders/RecommendedEventsLiveEventsHasEventsApiDataProvider';
import { useUniverseResource } from '../../../hooks/useChartResourceProvider';
import type { RecommendedEventsLiveEventsDialogProps } from './RecommendedEventsLiveEventsTableDialog';
import RecommendedEventsLiveEventsDialog from './RecommendedEventsLiveEventsTableDialog';

const RecommendedEventsLiveEventsDialogContainer: FC<RecommendedEventsLiveEventsDialogProps> = ({
  open,
  onClose,
  defaultEventType,
}) => {
  const { id: universeId } = useUniverseResource();
  // Event type is a dialog-internal piece of state seeded from the caller's
  // metric/page-derived `defaultEventType`. The caller owns "what stream is
  // contextually right" (in explore mode that's the metric; on the dedicated
  // Custom/Economy/Funnels pages it's the page domain), and the in-dialog
  // dropdown lets the user pivot streams without leaking the choice into the
  // page URL — which would shadow whatever default the next caller resolves.
  const [eventType, setEventType] = useState(defaultEventType);
  // If the caller's default changes while the dialog is mounted (e.g. the
  // explore-mode metric switches), snap eventType to the new default during
  // render. This is the React-recommended "derived state" pattern — calling
  // setState during render (not in an effect) avoids cascading re-renders.
  const [prevDefaultEventType, setPrevDefaultEventType] = useState(defaultEventType);
  if (prevDefaultEventType !== defaultEventType) {
    setPrevDefaultEventType(defaultEventType);
    setEventType(defaultEventType);
  }

  return (
    <RecommendedEventsLiveEventsHasEventsApiDataContextProvider universeId={universeId}>
      <RecommendedEventsLiveEventsApiDataContextProvider
        eventType={eventType}
        universeId={universeId}>
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

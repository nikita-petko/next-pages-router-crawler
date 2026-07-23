import React, { FunctionComponent, useEffect, useMemo, Fragment } from 'react';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { CircularProgress } from '@rbx/ui';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { uuidService } from '@rbx/core';
import sendEventsAnalyticsEvent from '../../utils/eventsAnalyticsHelper';
import ConfigureEventFormV2 from './ConfigureEventFormV2';
import useCreateEvent from '../../hooks/useCreateEvent';

const CreateEventContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { trackerClient } = useEventTrackerProvider();
  const { gameDetails } = useCurrentGame();

  // Returns the newly-created event's id, or null if creation failed
  const createEvent = useCreateEvent();

  const correlationId = useMemo(() => uuidService.generateRandomUuid(), []);
  useEffect(() => {
    sendEventsAnalyticsEvent(trackerClient, {
      eventType: CreatorDashboardEventType.EventCreationInitiated,
      newEventCorrelationId: correlationId,
    });
  }, [correlationId, trackerClient]);

  return (
    <Fragment>
      {!gameDetails || !gameDetails.id ? (
        <CircularProgress data-testid='create-event-container-loading' />
      ) : (
        <ConfigureEventFormV2
          universeId={gameDetails?.id || 0}
          onSaveOrPublish={createEvent}
          correlationId={correlationId}
        />
      )}
    </Fragment>
  );
};

export default withTranslation(CreateEventContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.Error,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.AssetUpload,
]);

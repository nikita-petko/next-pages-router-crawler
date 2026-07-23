import Router, { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React, { useCallback, useState, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Alert, Button, DialogTemplate, useDialog, useSnackbar } from '@rbx/ui';
import virtualEventsClient from '@modules/clients/virtualEvents';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import sendEventsAnalyticsEvent from '../../utils/eventsAnalyticsHelper';

export interface DeleteEventButtonProps {
  eventId: string;
}

const DeleteEventButton: FunctionComponent<React.PropsWithChildren<DeleteEventButtonProps>> = ({
  eventId,
}) => {
  const { trackerClient } = useEventTrackerProvider();
  const { enqueue: enqueueToast } = useSnackbar();
  const router = useRouter();
  const universeId = router.query.id;

  const { translate } = useTranslation();
  const { gameDetails } = useCurrentGame();

  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const { open, close: closeDialog, configure } = useDialog();

  const returnToEventList = useCallback(() => {
    Router.push(`/dashboard/creations/experiences/${universeId}/events`);
  }, [universeId]);

  const showErrorMessage = useCallback(() => {
    enqueueToast(
      {
        autoHide: false,
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
        children: <Alert severity='error'>{translate('Message.CancelEventFailed')}</Alert>,
      },
      (reason) => reason === 'clickaway',
    );
  }, [enqueueToast, translate]);

  // TODO @rachel.anderson: Copy may need to be updated for this dialog, awaiting design
  const handleDeleteEvent = useCallback(async () => {
    setIsDeleting(true);
    try {
      await virtualEventsClient.deleteEvent(eventId);
      sendEventsAnalyticsEvent(trackerClient, {
        eventType: CreatorDashboardEventType.EventCreationDeleteDraft,
        virtualEventId: eventId,
        universeId: gameDetails?.id?.toString(),
      });
      returnToEventList();
    } catch {
      showErrorMessage();
    } finally {
      setIsDeleting(false);
      closeDialog();
    }
  }, [eventId, trackerClient, gameDetails?.id, returnToEventList, showErrorMessage, closeDialog]);

  const DeleteEventDialog = useMemo(
    () => (
      <DialogTemplate
        color='destructive'
        onConfirm={handleDeleteEvent}
        onCancel={closeDialog}
        title={translate(`Title.DeleteEvent`)}
        content={translate(`Description.DeleteEvent`)}
        confirmText={translate(`Action.DeleteEvent`)}
        cancelText={translate('Action.Close')}
        loading={isDeleting}
      />
    ),
    [handleDeleteEvent, closeDialog, translate, isDeleting],
  );

  const handleDeleteButtonClick = useCallback(() => {
    configure(DeleteEventDialog);
    open();
  }, [configure, DeleteEventDialog, open]);

  return (
    <Button
      color='secondary'
      size='large'
      variant='outlined'
      onClick={handleDeleteButtonClick}
      data-testid='delete-event-button'>
      {translate('Action.Delete')}
    </Button>
  );
};

export default DeleteEventButton;

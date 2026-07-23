import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  DeleteOutlinedIcon,
  DialogTemplate,
  ListItemIcon,
  MenuItem,
  Typography,
  useDialog,
  useSnackbar,
} from '@rbx/ui';
import virtualEventsClient from '@modules/clients/virtualEvents';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { toastDurationTime } from '@modules/miscellaneous/common';
import useCurrentEvent from '../../hooks/useCurrentEvent';
import sendEventsAnalyticsEvent from '../../utils/eventsAnalyticsHelper';

export interface DeleteEventMenuItemProps {
  handleClose: () => void;
  removeItem: () => void;
}

const DeleteEventMenuItem: FunctionComponent<React.PropsWithChildren<DeleteEventMenuItemProps>> = ({
  handleClose,
  removeItem,
}) => {
  const { eventDetails } = useCurrentEvent();
  const { trackerClient } = useEventTrackerProvider();
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const { open, close: closeDialog, configure } = useDialog();
  const { enqueue, close: closeSnackbar } = useSnackbar();
  const { translate } = useTranslation();

  const showSnackbar = useCallback(
    (msg: React.JSX.Element) => {
      enqueue({
        message: msg,
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
        autoHideDuration: toastDurationTime,
        autoHide: true,
        onClose: closeSnackbar,
      });
    },
    [enqueue, closeSnackbar],
  );

  const handleDeleteEvent = useCallback(async () => {
    setIsDeleting(true);
    try {
      if (!eventDetails?.id) {
        throw new Error();
      }
      await virtualEventsClient.deleteEvent(eventDetails.id);

      sendEventsAnalyticsEvent(trackerClient, {
        eventType: CreatorDashboardEventType.EventCreationDeleteDraft,
        virtualEventId: eventDetails.id,
        universeId: eventDetails.universeId?.toString(),
      });

      removeItem();

      showSnackbar(
        <span data-testid='success-message'>{translate('Message.DeleteEventSuccess')}</span>,
      );
    } catch {
      const errorMsg = (
        <span data-testid='error-message'>{translate('Response.DeleteEventFailed')}</span>
      );
      showSnackbar(errorMsg);
    } finally {
      setIsDeleting(false);
      closeDialog();
      handleClose();
    }
  }, [eventDetails, trackerClient, removeItem, showSnackbar, translate, closeDialog, handleClose]);

  const confirmDeleteEventDialog = useMemo(
    () => (
      <DialogTemplate
        color='destructive'
        onConfirm={handleDeleteEvent}
        onCancel={closeDialog}
        title={translate('Title.DeleteEvent')}
        content={translate('Description.DeleteEvent')}
        confirmText={translate('Action.Delete')}
        cancelText={translate('Action.Close')}
        loading={isDeleting}
      />
    ),
    [isDeleting, handleDeleteEvent, translate, closeDialog],
  );

  const handleOpenDialog = useCallback(() => {
    configure(confirmDeleteEventDialog);
    open();
  }, [configure, open, confirmDeleteEventDialog]);

  useEffect(() => {
    if (isDeleting) {
      configure(confirmDeleteEventDialog);
    }
  }, [isDeleting, confirmDeleteEventDialog, configure]);

  return (
    <MenuItem
      data-testid='event-menu-item-delete-event'
      onClick={handleOpenDialog}
      disabled={isDeleting}>
      <ListItemIcon>
        <DeleteOutlinedIcon color='error' />
      </ListItemIcon>
      <Typography color='error'>{translate('Action.DeleteEvent')}</Typography>
    </MenuItem>
  );
};

export default DeleteEventMenuItem;

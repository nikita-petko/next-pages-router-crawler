import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { EventVisibility } from '@rbx/client-virtual-events-api/v1';
import { useTranslation } from '@rbx/intl';
import {
  DialogTemplate,
  ListItemIcon,
  MenuItem,
  Typography,
  useDialog,
  useSnackbar,
  VisibilityOffOutlinedIcon,
  VisibilityOutlinedIcon,
} from '@rbx/ui';
import virtualEventsClient from '@modules/clients/virtualEvents';
import { toastDurationTime } from '@modules/miscellaneous/common';
import useCurrentEvent from '../../hooks/useCurrentEvent';
import useMakeThumbnailsPublic from '../../hooks/useMakeThumbnailsPublic';

export interface ChangePrivacyMenuItemProps {
  handleClose: () => void;
}

const ChangePrivacyMenuItem: FunctionComponent<
  React.PropsWithChildren<ChangePrivacyMenuItemProps>
> = ({ handleClose }) => {
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const { open, close: closeDialog, configure } = useDialog();
  const { enqueue, close: closeSnackbar } = useSnackbar();
  const { translate } = useTranslation();
  const { eventDetails, refreshEventDetails } = useCurrentEvent();
  const makeThumbnailsPublic = useMakeThumbnailsPublic();

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

  const handleUpdateEvent = useCallback(
    async (targetVisibility: EventVisibility) => {
      setIsUpdating(true);
      try {
        if (!eventDetails || !eventDetails.id) {
          throw new Error();
        }

        if (
          targetVisibility === EventVisibility.Public &&
          eventDetails.thumbnails &&
          eventDetails.thumbnails.length
        ) {
          await makeThumbnailsPublic(eventDetails.thumbnails);
        }

        // Event Category and Media must always be included in the update call
        await virtualEventsClient.updateEvent(eventDetails?.id, {
          thumbnails: eventDetails.thumbnails ?? undefined,
          eventCategories: eventDetails.eventCategories,
          visibility: targetVisibility,
        });
        refreshEventDetails();
        showSnackbar(
          <span data-testid='success-message'>{translate('Message.EventCreationSuccess')}</span>,
        );
      } catch {
        const errorMsg = (
          <span data-testid='error-message'>{translate('Error.FailedToUpdateEvent')}</span>
        );
        showSnackbar(errorMsg);
      } finally {
        setIsUpdating(false);
        closeDialog();
        handleClose();
      }
    },
    [
      eventDetails,
      refreshEventDetails,
      showSnackbar,
      translate,
      makeThumbnailsPublic,
      closeDialog,
      handleClose,
    ],
  );

  const confirmPrivateEventDialog = useMemo(
    () => (
      <DialogTemplate
        color='destructive'
        onConfirm={() => handleUpdateEvent(EventVisibility.Private)}
        onCancel={closeDialog}
        title={translate('Heading.EEMakeEventPrivate')}
        content={translate('Description.EEPrivateEventConfirmation')}
        confirmText={translate('Action.MakePrivate')}
        cancelText={translate('Action.Close')}
        loading={isUpdating}
      />
    ),
    [isUpdating, handleUpdateEvent, translate, closeDialog],
  );

  const handleOpenDialog = useCallback(() => {
    configure(confirmPrivateEventDialog);
    open();
  }, [configure, open, confirmPrivateEventDialog]);

  useEffect(() => {
    if (isUpdating) {
      configure(confirmPrivateEventDialog);
    }
  }, [isUpdating, confirmPrivateEventDialog, configure]);

  return eventDetails?.eventVisibility === EventVisibility.Public ? (
    <MenuItem onClick={handleOpenDialog}>
      <ListItemIcon>
        <VisibilityOffOutlinedIcon />
      </ListItemIcon>
      <Typography>{translate('Action.EEChangeToPrivate')}</Typography>
    </MenuItem>
  ) : (
    <MenuItem
      onClick={() => {
        handleUpdateEvent(EventVisibility.Public);
      }}>
      <ListItemIcon>
        <VisibilityOutlinedIcon />
      </ListItemIcon>
      <Typography>{translate('Action.EEChangeToPublic')}</Typography>
    </MenuItem>
  );
};

export default ChangePrivacyMenuItem;

import React, { Fragment, FunctionComponent, useCallback, useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Grid,
  Typography,
  makeStyles,
} from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Invitation } from '@modules/clients/organizationApi';
import { usersClient } from '@modules/clients';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const useInviteActionedDialogStyles = makeStyles()(() => ({
  dialogTitle: {
    marginBottom: 12,
  },

  dialogContent: {
    paddingBottom: 0,
  },

  dialogActions: {
    margin: '0px 16px 0px 16px',
  },
}));

export interface InviteActionedDialogProps {
  open: boolean;
  onClose: () => void;
  invitation: Invitation;
  accepted: boolean;
}

const InviteActionedDialog: FunctionComponent<
  React.PropsWithChildren<InviteActionedDialogProps>
> = ({ open, onClose, invitation, accepted }) => {
  const { translate } = useTranslation();

  const {
    classes: { dialogTitle, dialogContent, dialogActions },
  } = useInviteActionedDialogStyles();

  const [username, setUsername] = useState<string>();
  const [usernameHasError, setUsernameHasError] = useState<boolean>();

  const fetchUsername = useCallback(async () => {
    if (!invitation?.senderUserId) {
      return;
    }

    try {
      const userResponse = await usersClient.getUserById(
        Number.parseInt(invitation.senderUserId, 10),
      );

      setUsername(userResponse.name);
      setUsernameHasError(false);
    } catch {
      setUsernameHasError(true);
    }
  }, [invitation]);

  // On load
  useEffect(() => {
    fetchUsername();
  }, [fetchUsername]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Dialog maxWidth='Medium' open={open} onClose={onClose}>
      <DialogContent className={dialogContent}>
        <Grid container wrap='wrap' alignItems='flex-start'>
          <Typography variant='h4' className={dialogTitle}>
            {accepted
              ? translate('Label.InvitationAccepted')
              : translate('Label.InvitationDeclined')}
          </Typography>

          <Typography variant='body1'>
            {accepted ? (
              <Fragment>
                {usernameHasError
                  ? translate('Message.InvitationAcceptedWithoutUsername')
                  : translate('Message.InvitationAccepted', { username: username ?? '' })}
              </Fragment>
            ) : (
              <Fragment>
                {usernameHasError
                  ? translate('Message.InvitationDeclinedWithoutUsername')
                  : translate('Message.InvitationDeclined', { username: username ?? '' })}
              </Fragment>
            )}
          </Typography>
        </Grid>
      </DialogContent>
      <DialogActions className={dialogActions}>
        <Grid container justifyContent='flex-end'>
          <Button variant='contained' color='primaryBrand' size='small' onClick={handleClose}>
            {translate('Action.Close')}
          </Button>
        </Grid>
      </DialogActions>
    </Dialog>
  );
};

export default withTranslation(InviteActionedDialog, [TranslationNamespace.Organization]);

import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Grid,
  Typography,
  makeStyles,
  useSnackbar,
} from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Invitation, InvitationStatusType } from '@modules/clients/organizationApi';
import { groupsClient, usersClient, organizationApiClient } from '@modules/clients';
import { toastDurationTime } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useCurrentOrganization from '../hooks/useCurrentOrganization';

const useAcceptInviteDialogStyles = makeStyles()(() => ({
  dialogTitle: {
    marginBottom: 12,
  },

  dialogContent: {
    paddingBottom: 0,
  },

  dialogSubActions: {
    '& > button:not(:last-child)': {
      marginRight: 8,
    },
  },
}));

export interface AcceptInviteDialogProps {
  open: boolean;
  onClose: (accepted?: boolean) => void;
  invitation: Invitation;
}

const AcceptInviteDialog: FunctionComponent<React.PropsWithChildren<AcceptInviteDialogProps>> = ({
  open,
  onClose,
  invitation,
}) => {
  const { translate } = useTranslation();
  const { organization } = useCurrentOrganization();

  const {
    classes: { dialogTitle, dialogContent, dialogSubActions },
  } = useAcceptInviteDialogStyles();

  const { enqueue, close } = useSnackbar();
  const showBottomToast = useCallback(
    (msg: string) => {
      enqueue({
        message: msg,
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
        autoHideDuration: toastDurationTime,
        autoHide: true,
        onClose: close,
      });
    },
    [enqueue, close],
  );

  const [groupName, setGroupName] = useState<string>();
  const [loading, setLoading] = useState<boolean>();

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

  const fetchGroupInfo = useCallback(async () => {
    if (!organization?.id || !organization?.groupId) {
      return;
    }

    try {
      const groupInfoResponse = await groupsClient.getGroupInfo(
        Number.parseInt(organization.groupId, 10),
      );

      setGroupName(groupInfoResponse?.name);
    } catch {
      showBottomToast(translate('Error.GroupInformation'));
    }
  }, [organization?.groupId, organization?.id, showBottomToast, translate]);

  // On load
  useEffect(() => {
    fetchUsername();
    fetchGroupInfo();
  }, [fetchGroupInfo, fetchUsername]);

  const handleNotNow = useCallback(() => {
    onClose(undefined);
  }, [onClose]);

  const handleDecline = useCallback(async () => {
    if (!invitation?.organizationId || !invitation?.id) return;

    setLoading(true);

    try {
      await organizationApiClient.invitationClient.acceptOrDeclineInvitation(
        invitation.organizationId,
        invitation.id,
        { status: InvitationStatusType.Declined },
      );

      onClose(false);
    } catch {
      showBottomToast(translate('Error.DecliningInvitation'));
      setLoading(false);
    }
  }, [invitation.id, invitation.organizationId, onClose, showBottomToast, translate]);

  const handleAccept = useCallback(async () => {
    if (!invitation?.organizationId || !invitation?.id) return;

    setLoading(true);

    try {
      await organizationApiClient.invitationClient.acceptOrDeclineInvitation(
        invitation.organizationId,
        invitation.id,
        { status: InvitationStatusType.Accepted },
      );

      onClose(true);
    } catch {
      showBottomToast(translate('Error.AcceptingInvitation'));
      setLoading(false);
    }
  }, [invitation.id, invitation.organizationId, onClose, showBottomToast, translate]);

  return (
    <Dialog maxWidth='Medium' open={open}>
      <DialogContent className={dialogContent}>
        <Grid container wrap='wrap' alignItems='flex-start'>
          <Grid container>
            <Typography variant='h4' className={dialogTitle}>
              {translate('Label.JoinOrganization', {
                organizationName: groupName ?? translate('Label.Group'),
              })}
            </Typography>
          </Grid>

          <Grid container>
            <Typography variant='body1'>
              {usernameHasError
                ? translate('Message.JoinOrganizationWithoutUsername')
                : translate('Message.JoinOrganization', { username: username ?? '' })}
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Grid container justifyContent='space-between'>
          <Button
            variant='outlined'
            color='primary'
            size='small'
            onClick={handleNotNow}
            disabled={loading}>
            {translate('Action.NotNow')}
          </Button>

          <Grid className={dialogSubActions}>
            <Button
              variant='outlined'
              color='primary'
              size='small'
              onClick={handleDecline}
              disabled={loading}>
              {translate('Action.Decline')}
            </Button>
            <Button
              variant='contained'
              color='primaryBrand'
              size='small'
              onClick={handleAccept}
              loading={loading}>
              {translate('Action.Accept')}
            </Button>
          </Grid>
        </Grid>
      </DialogActions>
    </Dialog>
  );
};

export default withTranslation(AcceptInviteDialog, [TranslationNamespace.Organization]);

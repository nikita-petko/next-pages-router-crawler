import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { ResourceType } from '@rbx/client-ownership-transfer-api/v1';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  useSnackbar,
} from '@rbx/ui';
import { AccountSettingsClient } from '@modules/clients/accountSettings';
import ownershipTransferClient from '@modules/clients/ownershipTransferApi';
import tryParseResponseError from '@modules/clients/utils/tryParseResponseError';
import { toastDurationTime } from '@modules/miscellaneous/common';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import OwnershipEvents from '../../constants/OwnershipEvents';
import ReceiveTransferVerificationContent from './ReceiveTransferVerificationContent';
import TransferDisclaimerContent from './TransferDisclaimerContent';
import type { ReceiveTransferDialogStage } from './types';

export type ReceiveTransferDialogProps = {
  dialogOpen: boolean;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  transferDialogStage: ReceiveTransferDialogStage;
  setTransferDialogStage: React.Dispatch<React.SetStateAction<ReceiveTransferDialogStage>>;
  isImplicationsAcknowledged: boolean;
  setIsImplicationsAcknowledged: React.Dispatch<React.SetStateAction<boolean>>;
  nameVerificationText: string;
  setNameVerificationText: React.Dispatch<React.SetStateAction<string>>;
  onSubmit?: () => void;
  setIsBannerButtonLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

const ReceiveTransferDialog: FunctionComponent<
  React.PropsWithChildren<ReceiveTransferDialogProps>
> = ({
  dialogOpen,
  setDialogOpen,
  transferDialogStage,
  setTransferDialogStage,
  isImplicationsAcknowledged,
  setIsImplicationsAcknowledged,
  nameVerificationText,
  setNameVerificationText,
  onSubmit,
  setIsBannerButtonLoading,
}) => {
  const { gameDetails } = useCurrentGame();
  const { translate, translateHTML } = useTranslation();
  const { enqueue, close } = useSnackbar();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const router = useRouter();

  const [isUserEmailVerified, setIsUserEmailVerified] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const fetchEmailStatus = async () => {
      const emailResponse = await AccountSettingsClient.emailApi.v1EmailGet();
      setIsUserEmailVerified(emailResponse?.verified ?? false);
    };
    fetchEmailStatus();
  }, []);

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

  const submitAcceptTransferRequest = useCallback(async () => {
    if (gameDetails?.id) {
      // Close dialog first since accepting takes a long time
      setIsSubmitting(true);
      setDialogOpen(false);
      setIsBannerButtonLoading(true);

      try {
        await ownershipTransferClient.acceptLatestTransfer({
          resourceType: ResourceType.Universe,
          resourceId: gameDetails?.id,
        });

        unifiedLogger.logClickEvent({
          eventName: OwnershipEvents.AcceptTransfer,
          parameters: {
            resourceType: ResourceType.Universe,
            resourceId: gameDetails?.id.toString(),
          },
        });
      } catch (error) {
        const errorResponse = await tryParseResponseError(error);
        // assume 403 errors are more likely to be GCC response
        if (errorResponse?.status === 403) {
          showBottomToast(translate('Error.TwoStepVerificationFailed'));
        }
        showBottomToast(translate('Error.FailedToAcceptTransferRequest'));
      } finally {
        setIsSubmitting(false);
        if (onSubmit) {
          onSubmit();
        }
      }
    }
  }, [
    gameDetails?.id,
    onSubmit,
    setDialogOpen,
    showBottomToast,
    translate,
    setIsBannerButtonLoading,
    unifiedLogger,
  ]);

  const submitRejectTransferRequest = useCallback(async () => {
    if (gameDetails?.id) {
      setIsSubmitting(true);

      try {
        await ownershipTransferClient.rejectLatestTransfer({
          resourceType: ResourceType.Universe,
          resourceId: gameDetails?.id,
        });

        unifiedLogger.logClickEvent({
          eventName: OwnershipEvents.DeclineTransfer,
          parameters: {
            resourceType: ResourceType.Universe,
            resourceId: gameDetails?.id.toString(),
          },
        });
      } catch {
        showBottomToast(translate('Error.FailedToDeclineTransferRequest'));
      } finally {
        setIsSubmitting(false);
        setDialogOpen(false);
        router.reload();
      }
    }
  }, [gameDetails?.id, setDialogOpen, showBottomToast, translate, router, unifiedLogger]);

  const receiveTransferInformationDialog = useCallback(() => {
    return (
      <>
        <DialogTitle>
          {translate('Title.RequestToOwn', { gameName: gameDetails?.name ?? '' })}
        </DialogTitle>
        <DialogContent>
          {translateHTML('Description.GroupHasReceivedRequest', [
            {
              opening: 'usernameStart',
              closing: 'usernameEnd',
              content: () => {
                return <b>{gameDetails?.creator?.name}</b>;
              },
            },
          ])}
        </DialogContent>
        <DialogActions>
          <Button
            variant='outlined'
            size='medium'
            color='secondary'
            onClick={() => {
              setDialogOpen(false);
            }}>
            {translate('Action.RemindMeLater')}
          </Button>
          <Button
            variant='contained'
            size='medium'
            onClick={() => {
              setIsImplicationsAcknowledged(false);
              setTransferDialogStage('Disclaimer');
            }}>
            {translate('Action.Next')}
          </Button>
        </DialogActions>
      </>
    );
  }, [
    translate,
    translateHTML,
    setDialogOpen,
    setIsImplicationsAcknowledged,
    setTransferDialogStage,
    gameDetails,
  ]);

  const receiveTransferDisclaimerDialog = useCallback(() => {
    return (
      <>
        <DialogTitle>{translate('Title.TransferDetails')}</DialogTitle>
        <DialogContent dividers>
          <TransferDisclaimerContent
            isImplicationsAcknowledged={isImplicationsAcknowledged}
            setIsImplicationsAcknowledged={setIsImplicationsAcknowledged}
            showReceiverContent
          />
        </DialogContent>
        <DialogActions>
          <Button
            variant='outlined'
            size='medium'
            color='secondary'
            onClick={() => {
              setTransferDialogStage('Information');
            }}>
            {translate('Action.Back')}
          </Button>
          <Button
            variant='contained'
            size='medium'
            color='secondary'
            disabled={!isImplicationsAcknowledged}
            onClick={() => {
              setNameVerificationText('');
              setTransferDialogStage('Verification');
            }}>
            {translate('Action.Next')}
          </Button>
        </DialogActions>
      </>
    );
  }, [
    translate,
    isImplicationsAcknowledged,
    setIsImplicationsAcknowledged,
    setNameVerificationText,
    setTransferDialogStage,
  ]);

  const receiveTransferVerificationDialog = useCallback(() => {
    return (
      <>
        <DialogTitle>{translate('Title.TransferDetails')}</DialogTitle>
        <DialogContent dividers>
          <ReceiveTransferVerificationContent
            nameVerificationText={nameVerificationText}
            setNameVerificationText={setNameVerificationText}
          />
        </DialogContent>
        <DialogActions>
          <Grid container justifyContent='space-between'>
            <Grid item XSmall>
              <Button
                variant='outlined'
                size='medium'
                color='secondary'
                onClick={() => {
                  setTransferDialogStage('Disclaimer');
                }}>
                {translate('Action.Back')}
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant='outlined'
                size='medium'
                color='destructive'
                style={{ marginRight: 8 }}
                onClick={() => {
                  setTransferDialogStage('DeclineConfirmation');
                }}>
                {translate('Action.DeclineTransfer')}
              </Button>
              <Button
                variant='contained'
                size='medium'
                disabled={
                  gameDetails?.name === undefined || nameVerificationText !== gameDetails.name
                }
                loading={isSubmitting}
                onClick={submitAcceptTransferRequest}>
                {translate('Action.AcceptTransfer')}
              </Button>
            </Grid>
          </Grid>
        </DialogActions>
      </>
    );
  }, [
    translate,
    gameDetails?.name,
    nameVerificationText,
    submitAcceptTransferRequest,
    setNameVerificationText,
    setTransferDialogStage,
    isSubmitting,
  ]);

  const receiveTransferDeclineConfirmationDialog = useCallback(() => {
    return (
      <>
        <DialogTitle>{translate('Title.DeclineOwnershipTransfer')}</DialogTitle>
        <DialogContent>
          {translateHTML('Description.DeclineTransfer', [
            {
              opening: 'gameNameStart',
              closing: 'gameNameEnd',
              content: () => {
                return <b>{gameDetails?.name}</b>;
              },
            },
          ])}
        </DialogContent>
        <DialogActions>
          <Button
            variant='outlined'
            size='medium'
            color='secondary'
            onClick={() => {
              setTransferDialogStage('Verification');
            }}>
            {translate('Action.Back')}
          </Button>
          <Button
            variant='contained'
            size='medium'
            color='destructive'
            style={{ marginRight: 8 }}
            loading={isSubmitting}
            onClick={submitRejectTransferRequest}>
            {translate('Action.Decline')}
          </Button>
        </DialogActions>
      </>
    );
  }, [
    translate,
    translateHTML,
    gameDetails?.name,
    submitRejectTransferRequest,
    setTransferDialogStage,
    isSubmitting,
  ]);

  const receiverNotEmailVerifiedDialog = useCallback(() => {
    return (
      <>
        <DialogTitle>{translate('Title.VerifyYourEmail')}</DialogTitle>
        <DialogContent>{translate('Description.VerifyYourEmail')}</DialogContent>
        <DialogActions>
          <Button
            variant='contained'
            size='medium'
            onClick={() => {
              setDialogOpen(false);
            }}>
            {translate('Action.Close')}
          </Button>
        </DialogActions>
      </>
    );
  }, [translate, setDialogOpen]);

  return (
    <Dialog
      open={dialogOpen}
      onClose={() => {
        setDialogOpen(false);
      }}>
      {isUserEmailVerified ? (
        <>
          {transferDialogStage === 'Information' && receiveTransferInformationDialog()}
          {transferDialogStage === 'Disclaimer' && receiveTransferDisclaimerDialog()}
          {transferDialogStage === 'Verification' && receiveTransferVerificationDialog()}
          {transferDialogStage === 'DeclineConfirmation' &&
            receiveTransferDeclineConfirmationDialog()}
        </>
      ) : (
        receiverNotEmailVerifiedDialog()
      )}
    </Dialog>
  );
};

export default ReceiveTransferDialog;

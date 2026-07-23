import React, { Fragment, FunctionComponent, useCallback, useState } from 'react';
import { ownershipTransferClient, tryParseResponseError, User } from '@modules/clients';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  useSnackbar,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import {
  ResourceType,
  CreatorType as TransferCreatorType,
} from '@rbx/clients/ownershipTransferApi';
import type { TGroup } from '@modules/authentication/types';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { toastDurationTime } from '@modules/miscellaneous/common';
import TransferDisclaimerContent from './TransferDisclaimerContent';
import InitiateTransferOwnerSelectionContent from './InitiateTransferOwnerSelectionContent';
import { TransferDialogStage } from './InitiateTransferButton';
import OwnershipEvents from '../../constants/OwnershipEvents';

export type InitiateTransferDialogProps = {
  dialogOpen: boolean;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  transferDialogStage: TransferDialogStage;
  setTransferDialogStage: React.Dispatch<React.SetStateAction<TransferDialogStage>>;
  isImplicationsAcknowledged: boolean;
  setIsImplicationsAcknowledged: React.Dispatch<React.SetStateAction<boolean>>;
  targetGroupId?: number;
  setTargetGroupId: React.Dispatch<React.SetStateAction<number | undefined>>;
  nameVerificationText: string;
  setNameVerificationText: React.Dispatch<React.SetStateAction<string>>;
  experienceCreator?: User | TGroup;
  onSubmit: () => void;
};

const InitiateTransferDialog: FunctionComponent<
  React.PropsWithChildren<InitiateTransferDialogProps>
> = ({
  dialogOpen,
  setDialogOpen,
  transferDialogStage,
  setTransferDialogStage,
  isImplicationsAcknowledged,
  setIsImplicationsAcknowledged,
  targetGroupId,
  setTargetGroupId,
  nameVerificationText,
  setNameVerificationText,
  experienceCreator,
  onSubmit,
}) => {
  const { gameDetails } = useCurrentGame();
  const { translate } = useTranslation();
  const { enqueue, close } = useSnackbar();
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

  const submitInitiateTransferRequest = useCallback(async () => {
    if (experienceCreator?.id && targetGroupId && gameDetails?.id && gameDetails?.creator?.type) {
      setIsSubmitting(true);
      try {
        // Validate creator type is valid
        if (
          gameDetails.creator.type !== TransferCreatorType.User &&
          gameDetails.creator.type !== TransferCreatorType.Group
        ) {
          showBottomToast(translate('Error.FailedToInitiateTransferRequest'));
          setIsSubmitting(false);
          return;
        }

        const currentCreatorType = gameDetails.creator.type;

        const transferDetails = await ownershipTransferClient.createTransfer(
          { creatorType: currentCreatorType, creatorId: experienceCreator?.id },
          { creatorType: TransferCreatorType.Group, creatorId: targetGroupId },
          { resourceType: ResourceType.Universe, resourceId: gameDetails?.id },
        );

        unifiedLogger.logClickEvent({
          eventName: OwnershipEvents.CreateTransfer,
          parameters: {
            transferId: transferDetails.holdId.toString(),
            currentCreatorType,
            currentCreatorId: transferDetails.currentCreator.creatorId.toString(),
            targetCreatorType: TransferCreatorType.Group,
            targetCreatorId: transferDetails.targetCreator.creatorId.toString(),
            resourceType: ResourceType.Universe,
            resourceId: transferDetails.resource.resourceId.toString(),
          },
        });
      } catch (error) {
        const errorResponse = await tryParseResponseError(error);
        // assume 403 errors are more likely to be GCC response
        if (errorResponse?.status === 403) {
          showBottomToast(translate('Error.TwoStepVerificationFailed'));
        }
        showBottomToast(translate('Error.FailedToInitiateTransferRequest'));
      } finally {
        setDialogOpen(false);
        setIsSubmitting(false);
        onSubmit();
      }
    }
  }, [
    experienceCreator?.id,
    targetGroupId,
    gameDetails?.id,
    gameDetails?.creator?.type,
    onSubmit,
    setDialogOpen,
    showBottomToast,
    translate,
    unifiedLogger,
  ]);

  const initiateTransferDisclaimerDialog = useCallback(() => {
    return (
      <Fragment>
        <DialogTitle>{translate('Title.TransferDetails')}</DialogTitle>
        <DialogContent dividers>
          <TransferDisclaimerContent
            isImplicationsAcknowledged={isImplicationsAcknowledged}
            setIsImplicationsAcknowledged={setIsImplicationsAcknowledged}
          />
        </DialogContent>
        <DialogActions>
          <Button
            variant='outlined'
            size='medium'
            color='secondary'
            onClick={() => {
              setDialogOpen(false);
            }}>
            {translate('Action.Cancel')}
          </Button>
          <Button
            variant='contained'
            size='medium'
            color='secondary'
            disabled={!isImplicationsAcknowledged}
            onClick={() => {
              setTargetGroupId(undefined);
              setNameVerificationText('');
              setTransferDialogStage('OwnerSelection');
            }}>
            {translate('Action.Next')}
          </Button>
        </DialogActions>
      </Fragment>
    );
  }, [
    translate,
    isImplicationsAcknowledged,
    setDialogOpen,
    setIsImplicationsAcknowledged,
    setNameVerificationText,
    setTargetGroupId,
    setTransferDialogStage,
  ]);

  const initiateTransferOwnerSelectionDialog = useCallback(() => {
    return (
      <Fragment>
        <DialogTitle>{translate('Title.TransferDetails')}</DialogTitle>
        <DialogContent dividers>
          <InitiateTransferOwnerSelectionContent
            targetGroupId={targetGroupId}
            setTargetGroupId={setTargetGroupId}
            nameVerificationText={nameVerificationText}
            setNameVerificationText={setNameVerificationText}
          />
        </DialogContent>
        <DialogActions>
          <Grid container justifyContent='space-between'>
            <Grid item XSmall>
              <Button
                variant='outlined'
                size='small'
                color='secondary'
                onClick={() => {
                  setDialogOpen(false);
                }}>
                {translate('Action.Cancel')}
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant='contained'
                size='small'
                color='secondary'
                style={{ marginRight: 8 }}
                onClick={() => {
                  setTransferDialogStage('Disclaimer');
                }}>
                {translate('Action.Back')}
              </Button>
              <Button
                variant='contained'
                size='small'
                disabled={
                  gameDetails?.name === undefined ||
                  nameVerificationText !== gameDetails.name ||
                  targetGroupId === undefined
                }
                loading={isSubmitting}
                onClick={submitInitiateTransferRequest}>
                {translate('Action.InitiateTransfer')}
              </Button>
            </Grid>
          </Grid>
        </DialogActions>
      </Fragment>
    );
  }, [
    translate,
    gameDetails?.name,
    nameVerificationText,
    targetGroupId,
    submitInitiateTransferRequest,
    setDialogOpen,
    setNameVerificationText,
    setTargetGroupId,
    setTransferDialogStage,
    isSubmitting,
  ]);

  return (
    <Dialog
      open={dialogOpen}
      onClose={() => {
        setDialogOpen(false);
      }}>
      {transferDialogStage === 'Disclaimer' && initiateTransferDisclaimerDialog()}
      {transferDialogStage === 'OwnerSelection' && initiateTransferOwnerSelectionDialog()}
    </Dialog>
  );
};

export default InitiateTransferDialog;

import type { FunctionComponent } from 'react';
import React, { Fragment, useCallback, useState } from 'react';
import { ResourceType } from '@rbx/client-ownership-transfer-api/v1';
import { useTranslation } from '@rbx/intl';
import {
  Link,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  useSnackbar,
} from '@rbx/ui';
import ownershipTransferClient from '@modules/clients/ownershipTransferApi';
import { toastDurationTime } from '@modules/miscellaneous/common';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { creatorHub } from '@modules/miscellaneous/urls';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import OwnershipEvents from '../../constants/OwnershipEvents';

export type CancelTransferButtonProps = {
  targetGroupName: string;
  onSubmit: () => void;
};

const CancelTransferButton: FunctionComponent<
  React.PropsWithChildren<CancelTransferButtonProps>
> = ({ targetGroupName, onSubmit }) => {
  const { translate, translateHTML } = useTranslation();
  const { gameDetails } = useCurrentGame();
  const { enqueue, close } = useSnackbar();
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

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

  const cancelTransferRequest = useCallback(async () => {
    if (gameDetails?.id) {
      try {
        await ownershipTransferClient.cancelLatestTransfer({
          resourceId: gameDetails?.id,
          resourceType: ResourceType.Universe,
        });

        unifiedLogger.logClickEvent({
          eventName: OwnershipEvents.CancelTransfer,
          parameters: {
            resourceType: ResourceType.Universe,
            resourceId: gameDetails?.id.toString(),
          },
        });

        setDialogOpen(false);
        showBottomToast(translate('Label.OwnershipTransferRequestCancelled'));
        onSubmit();
      } catch {
        setDialogOpen(false);
        showBottomToast(translate('Error.FailedCancelRequest'));
      }
    }
  }, [gameDetails?.id, showBottomToast, translate, onSubmit, unifiedLogger]);

  return (
    <>
      <Button
        variant='contained'
        size='small'
        color='secondary'
        onClick={() => {
          setDialogOpen(true);
        }}>
        {translate('Action.CancelTransferRequest')}
      </Button>
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
        }}>
        <DialogTitle>{translate('Title.TransferDetails')}</DialogTitle>
        <DialogContent dividers>
          <Typography variant='body1' color='secondary'>
            {translateHTML(
              'Description.CancelTransferRequest',
              [
                {
                  opening: 'detailsLinkStart',
                  closing: 'detailsLinkEnd',
                  content: (chunks) => {
                    return (
                      <Link
                        color='inherit'
                        href={creatorHub.docs.getOwnershipTransferUrl()}
                        target='_blank'>
                        {chunks}
                      </Link>
                    );
                  },
                },
              ],
              {
                gameName: <b>{gameDetails?.name}</b>,
                groupName: <b>{targetGroupName}</b>,
              },
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant='contained'
            size='medium'
            color='secondary'
            style={{ marginRight: 8 }}
            onClick={() => {
              setDialogOpen(false);
            }}>
            {translate('Action.Close')}
          </Button>
          <Button
            variant='contained'
            size='medium'
            onClick={cancelTransferRequest}
            color='destructive'>
            {translate('Action.Confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CancelTransferButton;

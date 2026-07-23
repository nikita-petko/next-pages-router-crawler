import React, { Fragment, FunctionComponent, useCallback, useState } from 'react';
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
import { useTranslation } from '@rbx/intl';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { ownershipTransferClient } from '@modules/clients';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { ResourceType } from '@rbx/clients/ownershipTransferApi';
import { toastDurationTime, urls } from '@modules/miscellaneous/common';
import OwnershipEvents from '../../constants/OwnershipEvents';

export type CancelTransferButtonProps = {
  targetGroupName: string;
  onSubmit: () => void;
};

const { creatorHub } = urls;

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
    <Fragment>
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
    </Fragment>
  );
};

export default CancelTransferButton;

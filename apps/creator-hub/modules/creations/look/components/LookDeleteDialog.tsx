import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import lookClient, { type LookType } from '@modules/clients/look';
import tryParseResponseError from '@modules/clients/utils/tryParseResponseError';
import Look from '@modules/miscellaneous/common/enums/Look';
import getRouteToAvatarItemCreationsPage from '../../avatarItem/utils/avatarMenuNavigationUtils';
import useCurrentLook from '../hooks/useCurrentLook';

interface LookDeleteDialogProps {
  lookId: string;
  showDeleteLookDialog: boolean;
  setShowDeleteLookDialog: (show: boolean) => void;
  setDeleteCompleted?: (completed: boolean) => void;
  lookType?: LookType;
}

function LookDeleteDialog(props: LookDeleteDialogProps) {
  const { lookId, showDeleteLookDialog, setShowDeleteLookDialog, setDeleteCompleted, lookType } =
    props;
  const { translate } = useTranslation();
  const { lookDetail } = useCurrentLook();

  const router = useRouter();

  const [deleteErrorMessage, setDeleteErrorMessage] = useState('');
  const [showDeleteErrorDialog, setShowDeleteErrorDialog] = useState(false);

  const backToCreationsPageLink = useMemo(() => {
    return getRouteToAvatarItemCreationsPage(lookType ?? lookDetail?.lookType ?? Look.Makeup);
  }, [lookType, lookDetail?.lookType]);

  const handleDelete = async () => {
    setShowDeleteLookDialog(false);
    try {
      await lookClient.deleteLook(lookId);
      void router.push(backToCreationsPageLink);
    } catch (e) {
      const error = await tryParseResponseError(e);

      // These should not really happen, but would help us debug the issue if they do
      switch (error?.code) {
        case undefined:
          setDeleteErrorMessage('Message.UnknownError');
          break;
        case 400:
          setDeleteErrorMessage('Message.InvalidRequest');
          break;
        case 403:
          setDeleteErrorMessage('Message.Forbidden');
          break;
        case 404:
          setDeleteErrorMessage('Message.NotFound');
          break;
        case 429:
          setDeleteErrorMessage('Message.TooManyRequests');
          break;
        default:
          setDeleteErrorMessage('Message.UnknownError');
      }
      setShowDeleteErrorDialog(true);
    }
    if (setDeleteCompleted) {
      setDeleteCompleted(true);
    }
  };

  return (
    <div>
      <Dialog
        open={showDeleteErrorDialog}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setShowDeleteErrorDialog(false);
          }
        }}
        size='Medium'
        isModal
        hasCloseAffordance={false}>
        <DialogContent>
          <DialogBody>
            <DialogTitle className='text-heading-medium margin-y-none padding-bottom-small'>
              {translate('Message.DeleteUnsuccessful')}
            </DialogTitle>
            <span className='text-body-medium'>
              {`${translate('Message.DeleteErrorMsgPrefix')} ${translate(deleteErrorMessage)}`}
            </span>
          </DialogBody>
          <DialogFooter>
            <div className='flex justify-end gap-medium'>
              <Button
                variant='Emphasis'
                type='button'
                aria-label={translate('Action.Ok')}
                onClick={() => setShowDeleteErrorDialog(false)}>
                {translate('Action.Ok')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={showDeleteLookDialog}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setShowDeleteLookDialog(false);
          }
        }}
        size='Medium'
        isModal
        hasCloseAffordance={false}>
        <DialogContent>
          <DialogBody>
            <DialogTitle className='text-heading-medium margin-y-none padding-bottom-small'>
              {translate('Heading.DeleteLook')}
            </DialogTitle>
            <span className='text-body-medium'>{translate('Message.DeleteLookDescription')}</span>
          </DialogBody>
          <DialogFooter>
            <div className='flex justify-end gap-small'>
              <Button
                variant='Standard'
                type='button'
                onClick={() => setShowDeleteLookDialog(false)}>
                {translate('Action.Cancel')}
              </Button>
              <Button variant='Alert' type='button' onClick={handleDelete}>
                {translate('Action.Delete')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LookDeleteDialog;

import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import { Dialog, DialogTemplate } from '@rbx/ui';
import lookClient from '@modules/clients/look';
import tryParseResponseError from '@modules/clients/utils/tryParseResponseError';
import Look from '@modules/miscellaneous/common/enums/Look';
import getRouteToAvatarItemCreationsPage from '../../avatarItem/utils/avatarMenuNavigationUtils';
import useCurrentLook from '../hooks/useCurrentLook';

interface LookDeleteDialogProps {
  lookId: string;
  showDeleteLookDialog: boolean;
  setShowDeleteLookDialog: (show: boolean) => void;
  setDeleteCompleted?: (completed: boolean) => void;
}

function LookDeleteDialog(props: LookDeleteDialogProps) {
  const { lookId, showDeleteLookDialog, setShowDeleteLookDialog, setDeleteCompleted } = props;
  const { translate } = useTranslation();
  const { lookDetail } = useCurrentLook();

  const router = useRouter();

  const [deleteErrorMessage, setDeleteErrorMessage] = useState('');
  const [showDeleteErrorDialog, setShowDeleteErrorDialog] = useState(false);

  const backToCreationsPageLink = useMemo(() => {
    return getRouteToAvatarItemCreationsPage(lookDetail?.lookType ?? Look.Makeup);
  }, [lookDetail?.lookType]);

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
      <Dialog open={showDeleteErrorDialog}>
        <DialogTemplate
          onConfirm={() => setShowDeleteErrorDialog(false)}
          onCancel={() => setShowDeleteErrorDialog(false)}
          title={translate('Message.DeleteUnsuccessful')}
          content={`${translate('Message.DeleteErrorMsgPrefix')} ${translate(deleteErrorMessage)}`}
          confirmText={translate('Action.Ok')}
          cancelText={translate('Action.Cancel')}
        />
      </Dialog>
      <Dialog open={showDeleteLookDialog}>
        <DialogTemplate
          color='destructive'
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteLookDialog(false)}
          title={translate('Heading.DeleteLook')}
          content={translate('Message.DeleteLookDescription')}
          confirmText={translate('Action.Delete')}
          cancelText={translate('Action.Cancel')}
        />
      </Dialog>
    </div>
  );
}

export default LookDeleteDialog;

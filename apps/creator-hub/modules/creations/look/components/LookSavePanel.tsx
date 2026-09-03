import { useCallback, useState } from 'react';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { useSnackbar } from '@rbx/ui';
import lookClient from '@modules/clients/look';
import tryParseResponseError from '@modules/clients/utils/tryParseResponseError';
import LookDeleteDialog from './LookDeleteDialog';

interface LookSavePanelProps {
  isSaveDisabled: boolean;
  lookId: string;
  name: string;
  description: string;
}

function LookSavePanel(props: LookSavePanelProps) {
  const { isSaveDisabled, lookId, name, description } = props;

  const { translate } = useTranslation();
  const { enqueue } = useSnackbar();

  const [saveErrorMessage, setSaveErrorMessage] = useState('');
  const [showSaveErrorDialog, setShowSaveErrorDialog] = useState(false);
  const [showDeleteLookDialog, setShowDeleteLookDialog] = useState(false);

  const showSuccessToast = useCallback(() => {
    enqueue(
      {
        message: (
          <span data-testid='success-message'>{translate('Message.ChangesSuccessfullySaved')}</span>
        ),
        autoHide: true,
      },
      (reason) => reason === 'timeout',
    );
  }, [enqueue, translate]);

  const handleSaveChanges = async () => {
    try {
      await lookClient.updateLook(lookId, name, description);
      showSuccessToast();
    } catch (e) {
      const error = await tryParseResponseError(e);
      switch (error?.code) {
        case undefined:
          setSaveErrorMessage('Message.UnknownError');
          break;
        // TODO @mryumae: Add error codes
        default:
          setSaveErrorMessage('Message.UnknownError');
      }
      setShowSaveErrorDialog(true);
    }
  };

  return (
    <div>
      <div className='flex items-center gap-small margin-top-[40px]'>
        <Button
          variant='Emphasis'
          type='button'
          isDisabled={isSaveDisabled}
          onClick={handleSaveChanges}
          className='min-width-[100px]'>
          {translate('Action.Save')}
        </Button>
        <Button
          variant='Standard'
          type='button'
          onClick={() => setShowDeleteLookDialog(true)}
          className='min-width-[100px]'>
          {translate('Action.Delete')}
        </Button>
      </div>
      <Dialog
        open={showSaveErrorDialog}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setShowSaveErrorDialog(false);
          }
        }}
        size='Small'
        isModal
        hasCloseAffordance={false}>
        <DialogContent>
          <DialogBody>
            <DialogTitle className='text-heading-medium margin-y-none padding-bottom-small'>
              {translate('Message.SavingUnsuccessful')}
            </DialogTitle>
            <span className='text-body-medium'>
              {`${translate('Message.SaveErrorMsgPrefix')} ${translate(saveErrorMessage)}`}
            </span>
          </DialogBody>
          <DialogFooter>
            <div className='flex justify-end gap-small'>
              <Button
                variant='Standard'
                type='button'
                onClick={() => setShowSaveErrorDialog(false)}>
                {translate('Action.Cancel')}
              </Button>
              <Button
                variant='Emphasis'
                type='button'
                onClick={() => setShowSaveErrorDialog(false)}>
                {translate('Action.Ok')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <LookDeleteDialog
        lookId={lookId}
        showDeleteLookDialog={showDeleteLookDialog}
        setShowDeleteLookDialog={setShowDeleteLookDialog}
      />
    </div>
  );
}

export default LookSavePanel;

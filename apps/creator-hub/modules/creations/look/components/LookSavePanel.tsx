import { useCallback, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Button, Dialog, DialogTemplate, Grid, makeStyles, useSnackbar } from '@rbx/ui';
import lookClient from '@modules/clients/look';
import tryParseResponseError from '@modules/clients/utils/tryParseResponseError';
import LookDeleteDialog from './LookDeleteDialog';

interface LookSavePanelProps {
  isSaveDisabled: boolean;
  lookId: string;
  name: string;
  description: string;
}

const useStyles = makeStyles()(() => ({
  saveButton: {
    minWidth: '100px',
  },
  deleteButton: {
    left: '10px',
    minWidth: '100px',
  },
}));

function LookSavePanel(props: LookSavePanelProps) {
  const { isSaveDisabled, lookId, name, description } = props;

  const { translate } = useTranslation();
  const {
    classes: { saveButton, deleteButton },
  } = useStyles();
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
      <Grid container item XSmall={12} marginTop='40px' alignItems='center'>
        <Grid item XSmall={9} alignItems='center' container paddingRight={12}>
          <Button
            variant='contained'
            disabled={isSaveDisabled}
            onClick={handleSaveChanges}
            classes={{ root: saveButton }}>
            {translate('Action.Save')}
          </Button>
          <Button
            variant='contained'
            color='secondary'
            onClick={() => setShowDeleteLookDialog(true)}
            classes={{ root: deleteButton }}>
            {translate('Action.Delete')}
          </Button>
        </Grid>
      </Grid>
      <Dialog open={showSaveErrorDialog}>
        <DialogTemplate
          onConfirm={() => setShowSaveErrorDialog(false)}
          onCancel={() => setShowSaveErrorDialog(false)}
          title={translate('Message.SavingUnsuccessful')}
          content={`${translate('Message.SaveErrorMsgPrefix')} ${translate(saveErrorMessage)}`}
          confirmText={translate('Action.Ok')}
          cancelText={translate('Action.Cancel')}
        />
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

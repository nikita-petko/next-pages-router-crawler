import type { FunctionComponent } from 'react';
import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
} from '@rbx/ui';
import { useTranslationContext } from '../providers/TranslationProvider';

type SaveConfirmationDialogProps = {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  grantedList: string[];
  revokedList: string[];
};

const SaveConfirmationDialog: FunctionComponent<SaveConfirmationDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  grantedList,
  revokedList,
}) => {
  const { translate } = useTranslationContext();
  return (
    <Dialog open={isOpen} data-testid='save-confirmation-dialog'>
      <DialogTitle>{translate('SaveConfirmation.Title')}</DialogTitle>
      <DialogContent dividers>
        <Typography variant='body1'>{translate('SaveConfirmation.Summary')}</Typography>
        {grantedList?.length ? (
          <Grid>
            <Typography variant='body1'>{translate('SaveConfirmation.GrantSummary')}</Typography>
            <ul>
              {grantedList.map((permission) => (
                <li key={permission}>{translate(`${permission}.Label`)}</li>
              ))}
            </ul>
          </Grid>
        ) : null}
        {revokedList?.length ? (
          <Grid>
            <Typography variant='body1'>{translate('SaveConfirmation.RevokeSummary')}</Typography>
            <ul>
              {revokedList.map((permission) => (
                <li key={permission}>{translate(`${permission}.Label`)}</li>
              ))}
            </ul>
          </Grid>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button
          variant='outlined'
          color='primary'
          onClick={onCancel}
          data-testid='save-confirmation-cancel-button'>
          {translate('SaveConfirmation.Action.Cancel')}
        </Button>
        <Button
          variant='contained'
          color='primaryBrand'
          onClick={onConfirm}
          data-testid='save-confirmation-save-button'>
          {translate('SaveConfirmation.Action.Confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export { SaveConfirmationDialog, type SaveConfirmationDialogProps };

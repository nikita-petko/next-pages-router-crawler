import { Fragment } from 'react';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  DialogContentText,
  Typography,
} from '@rbx/ui';
import type { DialogConfiguration } from '../utils/buildOAuthEditDialogConfig';

interface EditRedirectDialogCardProps {
  dialogConfig: DialogConfiguration;
}

const EditRedirectDialogCard = ({ dialogConfig }: EditRedirectDialogCardProps) => {
  const {
    title,
    firstPartContent,
    secondPartContent,
    confirmText,
    confirmAction,
    confirmIcon,
    cancelAction,
    cancelText,
    confirmButtonColor,
  } = dialogConfig;
  return (
    <>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <DialogContentText>
          <Typography component='p'>{firstPartContent}</Typography>
          <br />
          <Typography component='p'>{secondPartContent}</Typography>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        {cancelText && (
          <Button onClick={cancelAction} variant='outlined' color='primary'>
            {cancelText}
          </Button>
        )}
        {confirmButtonColor === 'alert' ? (
          <Button
            variant='contained'
            onClick={confirmAction}
            color='destructive'
            startIcon={confirmIcon}>
            {confirmText}
          </Button>
        ) : (
          <Button
            onClick={confirmAction}
            startIcon={confirmIcon}
            color={confirmButtonColor}
            variant='contained'>
            {confirmText}
          </Button>
        )}
      </DialogActions>
    </>
  );
};

export default EditRedirectDialogCard;

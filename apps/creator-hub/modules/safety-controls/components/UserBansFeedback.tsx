import React from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Typography,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { UserBansState } from '../layout/UserBansStateProvider';

type UserBansFeedbackProps = {
  userBansState: UserBansState;
  setUserBansState: (state: UserBansState) => void;
  snackbarMessage: string;
  setSnackbarMessage: (message: string) => void;
  listUserIdsError: string[];
  setListUserIdsError: (userIds: string[]) => void;
};

const UserBansFeedback = ({
  userBansState,
  setUserBansState,
  snackbarMessage,
  setSnackbarMessage,
  listUserIdsError,
  setListUserIdsError,
}: UserBansFeedbackProps) => {
  // Reset the context states to default
  const handleClose = () => {
    setUserBansState(UserBansState.Default);
    setSnackbarMessage('');
    setListUserIdsError([]);
  };

  const { translate } = useTranslation();

  let snackbarAlert = <></>;
  if (userBansState === UserBansState.SnackbarError) {
    snackbarAlert = (
      <Alert severity='error' variant='standard'>
        <Typography variant='subtitle2'>{snackbarMessage}</Typography>
      </Alert>
    );
  } else if (userBansState === UserBansState.SnackbarSuccess) {
    snackbarAlert = (
      <Alert severity='success' variant='standard'>
        <Typography variant='subtitle2'>{snackbarMessage}</Typography>
      </Alert>
    );
  }

  const banUsersDialogErrorState =
    userBansState === UserBansState.BanUsersNotFoundDialogError ||
    userBansState === UserBansState.BanUsersGenericDialogError;

  let dialogTitle;
  let dialogContentDescription;
  switch (userBansState) {
    case UserBansState.BanUsersNotFoundDialogError:
      dialogTitle = translate('Title.BanUsersDialogError');
      dialogContentDescription = translate('Description.BanUsersDialogError');
      break;
    case UserBansState.BanUsersGenericDialogError:
      dialogTitle = translate('Title.BanUsersGenericDialogError');
      dialogContentDescription = translate('Description.BanUsersDialogError');
      break;
    case UserBansState.UnbanUsersDialogError:
      dialogTitle = translate('Title.UnbanUsersDialogError');
      dialogContentDescription = translate('Description.UnbanUsersDialogError');
  }

  return (
    <React.Fragment>
      <Snackbar
        anchorOrigin={{
          horizontal: 'center',
          vertical: 'top',
        }}
        open={
          userBansState === UserBansState.SnackbarError ||
          userBansState === UserBansState.SnackbarSuccess
        }
        onClose={handleClose}
        autoHide>
        {/* Need to wrap the Alert inside a div due to the following issue: https://github.com/mui/material-ui/issues/28918 */}
        <div>{snackbarAlert}</div>
      </Snackbar>
      <Dialog
        open={banUsersDialogErrorState || userBansState === UserBansState.UnbanUsersDialogError}
        fullWidth>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {dialogContentDescription}
            <ul>
              {listUserIdsError.map((userId: string) => (
                <li key={userId}>{userId}</li>
              ))}
            </ul>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button size='large' variant='contained' onClick={handleClose}>
            {translate('Action.Dismiss')}
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
};

export default UserBansFeedback;

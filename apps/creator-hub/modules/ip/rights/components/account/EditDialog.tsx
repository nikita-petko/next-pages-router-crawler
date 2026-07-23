import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  InfoOutlinedIcon,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LockIcon,
  Typography,
} from '@rbx/ui';
import React, { FunctionComponent } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export interface EditDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EditDialog: FunctionComponent<EditDialogProps> = ({ open, onClose, onSuccess }) => {
  const { ready, translate } = useTranslation();
  if (!ready) {
    return null;
  }

  return (
    <Dialog onClose={onClose} open={open}>
      <DialogTitle>{translate('Action.SubmitEditRegistrationForm')}</DialogTitle>
      <DialogContent dividers>
        <DialogContentText component='span'>
          <List>
            <ListItem sx={{ padding: '3px' }}>
              <ListItemIcon>
                <LockIcon color='disabled' />
              </ListItemIcon>
              <ListItemText
                primary={
                  <span>
                    <Typography component='span' variant='subtitle2' color='primary'>
                      {translate('Description.SubmitEditDialogLockedState')}
                    </Typography>
                  </span>
                }
                secondary={
                  <Typography component='span' variant='body1'>
                    {translate('Description.SubmitEditDialogLockedStateDetailed')}
                  </Typography>
                }
              />
            </ListItem>
            <ListItem sx={{ padding: '3px' }}>
              <ListItemIcon>
                <InfoOutlinedIcon color='disabled' />
              </ListItemIcon>
              <ListItemText
                primary={
                  <span>
                    <Typography component='span' variant='subtitle2' color='primary'>
                      {translate('Description.SubmitEditDialogPendingRequests')}
                    </Typography>
                  </span>
                }
                secondary={
                  <Typography component='span' variant='body1'>
                    {translate('Description.SubmitEditDialogPendingRequestsDetailed')}
                  </Typography>
                }
              />
            </ListItem>
          </List>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button variant='outlined' color='secondary' onClick={onClose}>
          {translate('Label.Cancel')}
        </Button>
        <Button variant='contained' onClick={onSuccess}>
          {translate('Action.ContinueToEdit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default withTranslation(EditDialog, [TranslationNamespace.RightsPortal]);

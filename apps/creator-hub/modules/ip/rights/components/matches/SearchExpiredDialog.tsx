import React from 'react';
import { Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export interface SearchExpiredDialogProps {
  onRestartSearch: () => void;
  onContinue: () => void;
}

const SearchExpiredDialog = ({ onRestartSearch, onContinue }: SearchExpiredDialogProps) => {
  const { ready, translate } = useTranslation();
  if (!ready) {
    return null;
  }
  return (
    <Dialog open fullWidth maxWidth='Medium'>
      <DialogTitle>Search expired</DialogTitle>
      <DialogContent>
        <Typography variant='body2' color='secondary'>
          {translate('Description.SearchExpired')}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onRestartSearch} color='primary' variant='outlined'>
          {translate('Action.RestartSearch')}
        </Button>
        <Button onClick={onContinue} color='primaryBrand' variant='contained'>
          {translate('Action.Continue')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default withTranslation(SearchExpiredDialog, [TranslationNamespace.RightsPortal]);

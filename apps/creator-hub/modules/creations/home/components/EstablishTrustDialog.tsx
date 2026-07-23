import React, { FunctionComponent, useState, useEffect } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  IconButton,
  CloseIcon,
  Dialog,
  Typography,
  DialogActions,
  Button,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import getShowParentalConsentOptionsFeatureAccess from '../../common/clients/parentalConsentOptionsFeatureAccess';

export interface EstablishTrustDialogProps {
  open: boolean;
  onAddTrustedFriends: () => void;
  onAskParent: () => void;
  onClose: () => void;
}

const EstablishTrustDialog: FunctionComponent<EstablishTrustDialogProps> = ({
  open,
  onAddTrustedFriends,
  onAskParent,
  onClose,
}) => {
  const { translate } = useTranslation();
  const [showParentalConsentOptions, setShowParentalConsentOptions] = useState(false);

  useEffect(() => {
    async function load() {
      const shouldShowParentalConsentOptions = await getShowParentalConsentOptionsFeatureAccess();
      setShowParentalConsentOptions(shouldShowParentalConsentOptions);
    }
    load();
  }, []);
  return (
    <Dialog open={open} maxWidth='XLarge'>
      <DialogTitle>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: 'white',
          }}>
          <Typography variant='h1'>{translate('Title.AddTrustedConnectionsDialog')}</Typography>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginLeft: '16px' }}>
            <IconButton
              onClick={onClose}
              size='small'
              aria-label={translate('Action.CloseDialog')}
              color='inherit'>
              <CloseIcon color='inherit' />
            </IconButton>
          </div>
        </div>
      </DialogTitle>
      <DialogContent>
        <DialogContentText id='dialog-content-text-describe-id'>
          <Typography variant='body1'>
            {showParentalConsentOptions
              ? translate('Label.CollaborateOutsideAgeGroupWithParent')
              : translate('Label.CollaborateOutsideAgeGroup')}
          </Typography>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          size='large'
          variant='contained'
          aria-label={translate('Action.ViewDetails')}
          onClick={onAddTrustedFriends}>
          {translate('Action.ViewDetails')}
        </Button>
        {showParentalConsentOptions && (
          <Button
            size='large'
            variant='outlined'
            aria-label={translate('Action.AskParent')}
            color='secondary'
            onClick={onAskParent}>
            {translate('Action.AskParent')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default withTranslation(EstablishTrustDialog, [TranslationNamespace.Creations]);

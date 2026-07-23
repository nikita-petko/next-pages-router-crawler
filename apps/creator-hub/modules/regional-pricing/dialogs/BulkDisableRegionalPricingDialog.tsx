import { memo } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

type BulkDisableRegionalPricingDialogProps = {
  isOpen: boolean;
  loading?: boolean;
  disabled?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const DisableRegionalPricingDialog = ({
  isOpen,
  loading = false,
  disabled = false,
  onClose,
  onConfirm,
}: BulkDisableRegionalPricingDialogProps) => {
  const { translate } = useTranslation();

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>{translate('Heading.DisableRegionalPricing')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{translate('Message.ApplyRegionalPricing')}</DialogContentText>
        <br />
        <DialogContentText>{translate('Message.DisableRegionalPricing')}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          color='secondary'
          variant='contained'
          size='large'
          disabled={disabled}>
          {translate('Action.Cancel')}
        </Button>
        <Button
          onClick={onConfirm}
          loading={loading}
          disabled={disabled}
          color='primaryBrand'
          variant='contained'
          size='large'>
          {translate('Action.ConfirmDisable')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default withTranslation(memo(DisableRegionalPricingDialog), [
  TranslationNamespace.Creations,
]);

import { memo } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

type BulkEnableRegionalPricingDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  disabled?: boolean;
};

function BulkEnableRegionalPricingDialog({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  disabled = false,
  children,
}: React.PropsWithChildren<BulkEnableRegionalPricingDialogProps>) {
  const { translate } = useTranslation();

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>{translate('Heading.ApplyRegionalPricing')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{translate('Message.ApplyRegionalPricing')}</DialogContentText>
        <br />
        <DialogContentText>{children}</DialogContentText>
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
          size='large'
          variant='contained'>
          {translate('Action.ConfirmEnable')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default withTranslation(memo(BulkEnableRegionalPricingDialog), [
  TranslationNamespace.Creations,
]);

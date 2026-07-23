import { useTranslation } from '@rbx/intl';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@rbx/ui';

type Props = {
  open: boolean;
  onClose: () => void;
};

function ExternalPurchaseTestModeConfirmationDialog({ open, onClose }: Props) {
  const { translate } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{translate('Heading.TestModeIsActive')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{translate('Message.TestModeIsActive')}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button variant='contained' onClick={onClose}>
          {translate('Label.Continue')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ExternalPurchaseTestModeConfirmationDialog;

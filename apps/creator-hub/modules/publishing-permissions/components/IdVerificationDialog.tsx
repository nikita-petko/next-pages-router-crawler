import type { FunctionComponent } from 'react';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';

interface IdVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinueWithId: () => void;
  onAddParent: () => void;
}

const IdVerificationDialog: FunctionComponent<IdVerificationDialogProps> = ({
  open,
  onOpenChange,
  onContinueWithId,
  onAddParent,
}) => {
  const { translate } = useTranslation();

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      size='Small'
      isModal
      hasCloseAffordance
      closeLabel={translate('Action.Close')}>
      <DialogContent>
        <DialogBody className='flex flex-col gap-medium'>
          <DialogTitle className='text-heading-medium margin-y-none'>
            {translate('Label.IdVerification')}
          </DialogTitle>
          <Typography className='text-body-medium'>
            {translate('Description.IdVerifiedDialog')}
          </Typography>
          <Typography className='text-body-medium'>
            {translate('Description.IdVerifiedDialogReverify')}
          </Typography>
        </DialogBody>
        <DialogFooter className='flex flex-col gap-xsmall'>
          <Button variant='Emphasis' className='fill' onClick={onContinueWithId}>
            {translate('Action.ContinueWithId')}
          </Button>
          <Button variant='Standard' className='fill' onClick={onAddParent}>
            {translate('Action.AddAParent')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IdVerificationDialog;

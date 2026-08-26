import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';

type DeleteShowcaseDialogProps = {
  isOpen: boolean;
  showcaseTitle: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

/**
 * Taking a showcase down stops it being served on the Marketplace homepage and
 * removes it from the community's Store tab (FR-C3.1). It does not refund the
 * publish it consumed, which is why the copy has to be explicit.
 */
const DeleteShowcaseDialog = ({
  isOpen,
  showcaseTitle,
  isDeleting = false,
  onConfirm,
  onClose,
}: DeleteShowcaseDialogProps) => {
  const { translate } = useTranslation();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
      size='Medium'
      isModal
      hasCloseAffordance={false}>
      <DialogContent>
        <DialogBody className='flex flex-col gap-xsmall'>
          <DialogTitle className='text-heading-small margin-none'>
            {translate('Heading.DeleteShowcase')}
          </DialogTitle>
          {/* Foundation 0.116 does not re-export DialogDescription. */}
          <span className='text-body-medium content-default'>
            {translate('Description.DeleteShowcase', { title: showcaseTitle })}
          </span>
        </DialogBody>
        <DialogFooter className='flex justify-end gap-small'>
          <Button
            variant='Alert'
            size='Medium'
            type='button'
            isLoading={isDeleting}
            isDisabled={isDeleting}
            onClick={onConfirm}>
            {translate('Action.DeleteShowcase')}
          </Button>
          <Button variant='Standard' size='Medium' type='button' onClick={onClose}>
            {translate('Action.Cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteShowcaseDialog;

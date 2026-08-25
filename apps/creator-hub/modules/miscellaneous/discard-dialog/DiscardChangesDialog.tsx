import type { FC } from 'react';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '../localization';

export type DiscardChangesDialogProps = {
  readonly open: boolean;
  /** Invoked when the user confirms the discard; the dialog closes afterwards. */
  readonly onConfirm: () => void;
  /** Closes the dialog without discarding — Cancel and the overlay. */
  readonly onClose: () => void;
};

const DiscardChangesDialog: FC<DiscardChangesDialogProps> = ({ open, onConfirm, onClose }) => {
  const { translate } = useTranslation();

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
      size='Medium'
      isModal
      hasCloseAffordance={false}>
      <DialogContent className='!min-width-[280px] width-full'>
        <DialogBody className='flex flex-col gap-y-xsmall'>
          <DialogTitle className='text-heading-small margin-y-none padding-bottom-xsmall'>
            {translate('Heading.DiscardChangesDialog' /* TranslationNamespace.Creations */)}
          </DialogTitle>
          <span className='text-body-medium content-default margin-none'>
            {translate('Description.DiscardChangesDialog' /* TranslationNamespace.Creations */)}
          </span>
        </DialogBody>
        <DialogFooter className='flex justify-end gap-small'>
          <Button
            variant='Emphasis'
            size='Medium'
            onClick={() => {
              onConfirm();
              onClose();
            }}>
            {translate('Action.Discard' /* TranslationNamespace.Creations */)}
          </Button>
          <Button variant='Standard' size='Medium' onClick={onClose}>
            {translate('Action.Cancel' /* TranslationNamespace.Creations */)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default withTranslation(DiscardChangesDialog, [TranslationNamespace.Creations]);

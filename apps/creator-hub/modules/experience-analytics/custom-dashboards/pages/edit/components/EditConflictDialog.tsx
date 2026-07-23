import type { FC } from 'react';
import { Button, Dialog, DialogBody, DialogContent, DialogTitle } from '@rbx/foundation-ui';
import useEditPageTranslations from '../useEditPageTranslations';

/**
 * Shown when an existing-dashboard save hits `CustomDashboardVersionConflictError`
 * because another writer saved first. Offers revert, save-as-new, or overwrite.
 */
type EditConflictDialogProps = {
  readonly open: boolean;
  readonly isSubmitting: boolean;
  readonly onClose: () => void;
  readonly onRevert: () => void;
  readonly onSaveAsNew: () => void;
  readonly onOverwrite: () => void;
};

const EditConflictDialog: FC<EditConflictDialogProps> = ({
  open,
  isSubmitting,
  onClose,
  onRevert,
  onSaveAsNew,
  onOverwrite,
}) => {
  const t = useEditPageTranslations();

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isSubmitting) {
          onClose();
        }
      }}
      size='Medium'
      isModal
      hasCloseAffordance
      closeLabel={t.conflictDialogCloseLabel}>
      <DialogContent>
        <DialogBody>
          <div className='flex flex-col gap-medium padding-top-medium padding-bottom-small'>
            <DialogTitle>{t.conflictDialogTitle}</DialogTitle>
            <p className='text-body-medium content-default margin-none text-wrap'>
              {t.conflictDialogBody}
            </p>
          </div>
        </DialogBody>
        <div className='flex flex-col small:flex-row small:justify-end gap-xsmall padding-medium padding-top-small'>
          <Button variant='Standard' isDisabled={isSubmitting} onClick={onRevert}>
            {t.conflictDialogRevertLabel}
          </Button>
          <Button variant='Standard' isDisabled={isSubmitting} onClick={onSaveAsNew}>
            {t.conflictDialogSaveAsNewLabel}
          </Button>
          <Button
            variant='Emphasis'
            isDisabled={isSubmitting}
            isLoading={isSubmitting}
            onClick={onOverwrite}>
            {t.conflictDialogOverwriteLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditConflictDialog;

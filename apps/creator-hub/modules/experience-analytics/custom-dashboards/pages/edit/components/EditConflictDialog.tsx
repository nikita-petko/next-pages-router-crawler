import { useId, type FC } from 'react';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
  Tooltip,
  TooltipTrigger,
  VisuallyHidden,
  type TButtonVariant,
} from '@rbx/foundation-ui';
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

type ConflictActionButtonProps = {
  readonly label: string;
  readonly description: string;
  readonly variant: TButtonVariant;
  readonly isDisabled: boolean;
  readonly isLoading?: boolean;
  readonly onClick: () => void;
};

const ConflictActionButton: FC<ConflictActionButtonProps> = ({
  label,
  description,
  variant,
  isDisabled,
  isLoading,
  onClick,
}) => {
  const descriptionId = useId();
  return (
    <>
      <Tooltip title={description} position='top-center'>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            className='shrink-0'
            isDisabled={isDisabled}
            isLoading={isLoading}
            aria-describedby={descriptionId}
            onClick={onClick}>
            {label}
          </Button>
        </TooltipTrigger>
      </Tooltip>
      <VisuallyHidden id={descriptionId}>{description}</VisuallyHidden>
    </>
  );
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
        <DialogFooter className='flex flex-col small:flex-row small:justify-end small:wrap gap-xsmall'>
          <ConflictActionButton
            label={t.conflictDialogRevertLabel}
            description={t.conflictDialogRevertDescription}
            variant='Standard'
            isDisabled={isSubmitting}
            onClick={onRevert}
          />
          <ConflictActionButton
            label={t.conflictDialogSaveAsNewLabel}
            description={t.conflictDialogSaveAsNewDescription}
            variant='Standard'
            isDisabled={isSubmitting}
            onClick={onSaveAsNew}
          />
          <ConflictActionButton
            label={t.conflictDialogOverwriteLabel}
            description={t.conflictDialogOverwriteDescription}
            variant='Emphasis'
            isDisabled={isSubmitting}
            isLoading={isSubmitting}
            onClick={onOverwrite}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditConflictDialog;

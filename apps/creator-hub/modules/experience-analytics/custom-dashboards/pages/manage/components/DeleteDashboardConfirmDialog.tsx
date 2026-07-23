import { type FC, useCallback } from 'react';
import { Button, Dialog, DialogBody, DialogContent, DialogTitle } from '@rbx/foundation-ui';
import type { CustomDashboardListItem } from '../../../types';
import { useManagePageTranslations } from '../useManagePageTranslations';

/**
 * Modal confirmation for the per-row Delete action — the only row mutation
 * requiring explicit confirmation. Unmounted between confirms so the
 * interpolated dashboard name never goes stale.
 */
type DeleteDashboardConfirmDialogProps = {
  readonly dashboard: CustomDashboardListItem | null;
  readonly isSubmitting: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
};

const DeleteDashboardConfirmDialog: FC<DeleteDashboardConfirmDialogProps> = ({
  dashboard,
  isSubmitting,
  onCancel,
  onConfirm,
}) => {
  const t = useManagePageTranslations();

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && !isSubmitting) {
        onCancel();
      }
    },
    [isSubmitting, onCancel],
  );

  if (!dashboard) {
    return null;
  }

  const body = t.deleteDialogBody({ name: dashboard.name });

  return (
    <Dialog
      open
      onOpenChange={handleOpenChange}
      size='Medium'
      isModal
      hasCloseAffordance
      closeLabel={t.deleteDialogCloseLabel}>
      <DialogContent>
        <DialogBody>
          <div className='flex flex-col gap-medium padding-top-medium padding-bottom-small'>
            <DialogTitle>{t.deleteDialogTitle}</DialogTitle>
            <p className='text-body-medium content-default margin-none text-wrap'>{body}</p>
          </div>
        </DialogBody>
        <div className='flex justify-end gap-xsmall padding-medium padding-top-small'>
          <Button variant='Standard' isDisabled={isSubmitting} onClick={onCancel}>
            {t.deleteDialogCancelLabel}
          </Button>
          <Button
            variant='Alert'
            isDisabled={isSubmitting}
            isLoading={isSubmitting}
            onClick={onConfirm}>
            {t.deleteDialogConfirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteDashboardConfirmDialog;

import { type FC, useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogTitle,
  TextInput,
} from '@rbx/foundation-ui';
import useTextFilterValidation from '@modules/experience-analytics-shared/text-filter/useTextFilterValidation';
import type { CustomDashboardListItem } from '../../../types';
import { MAX_DASHBOARD_NAME_LENGTH } from '../../../types';
import { useManagePageTranslations } from '../useManagePageTranslations';

/**
 * Rename dialog from the per-row overflow menu. Validation runs on submit
 * (live "required" while typing reads as accusatory) and renders inline next
 * to the field; storage failures (quota, unavailable) surface in the global
 * toast slot via the parent's `writeError`.
 */
type RenameDashboardDialogProps = {
  readonly dashboard: CustomDashboardListItem | null;
  readonly isSubmitting: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: (nextName: string) => void;
};

const RenameDashboardDialog: FC<RenameDashboardDialogProps> = ({
  dashboard,
  isSubmitting,
  onCancel,
  onConfirm,
}) => {
  const t = useManagePageTranslations();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState(() => dashboard?.name ?? '');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Microtask defer gives Foundation Dialog's focus management a frame.
  useEffect(() => {
    if (!dashboard) {
      return undefined;
    }
    const id = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
    return () => window.clearTimeout(id);
  }, [dashboard]);

  const trimmed = value.trim();
  const currentName = dashboard?.name ?? '';
  const isUnchanged = trimmed === currentName.trim();
  const { isBlocked: isNameBlocked, status: nameFilterStatus } = useTextFilterValidation(value, {
    initialConfirmedValue: currentName,
  });
  const moderationError = isNameBlocked ? t.renameValidationBlocked : null;
  const isNameFilterPending = nameFilterStatus === 'pending';
  const isSaveDisabled =
    isSubmitting || isNameFilterPending || isNameBlocked || trimmed.length === 0 || isUnchanged;

  const handleSubmit = useCallback(() => {
    if (trimmed.length === 0) {
      setValidationError(t.renameValidationRequired);
      return;
    }
    if (trimmed.length > MAX_DASHBOARD_NAME_LENGTH) {
      setValidationError(t.renameValidationTooLong({ max: String(MAX_DASHBOARD_NAME_LENGTH) }));
      return;
    }
    if (isNameBlocked) {
      setValidationError(t.renameValidationBlocked);
      return;
    }
    setValidationError(null);
    onConfirm(trimmed);
  }, [isNameBlocked, onConfirm, t, trimmed]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' && !isSaveDisabled) {
        event.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit, isSaveDisabled],
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && !isSubmitting) {
        onCancel();
      }
    },
    [isSubmitting, onCancel],
  );

  const handleValueChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
    setValidationError((current) => (current ? null : current));
  }, []);

  if (!dashboard) {
    return null;
  }

  return (
    <Dialog
      open
      onOpenChange={handleOpenChange}
      size='Small'
      isModal
      hasCloseAffordance
      closeLabel={t.renameDialogCloseLabel}>
      <DialogContent>
        <DialogBody>
          <DialogTitle>{t.renameDialogTitle}</DialogTitle>
          <div className='padding-top-medium'>
            <TextInput
              ref={inputRef}
              size='Medium'
              label={t.renameDialogFieldLabel}
              placeholder={t.renameDialogPlaceholder}
              value={value}
              onChange={handleValueChange}
              onKeyDown={handleKeyDown}
              isDisabled={isSubmitting}
              error={validationError ?? moderationError ?? undefined}
              maxLength={MAX_DASHBOARD_NAME_LENGTH}
            />
          </div>
        </DialogBody>
        <div className='flex justify-end gap-xsmall padding-medium'>
          <Button variant='Standard' isDisabled={isSubmitting} onClick={onCancel}>
            {t.renameDialogCancelLabel}
          </Button>
          <Button
            variant='Emphasis'
            isDisabled={isSaveDisabled}
            isLoading={isSubmitting}
            onClick={handleSubmit}>
            {t.renameDialogConfirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RenameDashboardDialog;

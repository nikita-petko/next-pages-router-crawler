import type { TTailwindIconClass } from '@rbx/foundation-tailwind/classes';
import { Snackbar } from '@rbx/foundation-ui';
import { memo, useCallback, useState } from 'react';

import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

type Severity = 'error' | 'success' | 'warning';

interface GenericSnackBarProps {
  message: string;
  onClose?: () => void;
  severity: Severity;
}

const SEVERITY_ICON: Record<Severity, TTailwindIconClass> = {
  error: 'icon-regular-triangle-exclamation',
  success: 'icon-filled-circle-check',
  warning: 'icon-regular-triangle-exclamation',
};

const GenericSnackBar = memo(({ message, onClose, severity }: GenericSnackBarProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Misc);
  const [open, setOpen] = useState<boolean>(true);

  const handleClose = useCallback(() => {
    setOpen(false);
    onClose?.();
  }, [onClose]);

  if (!open) {
    return null;
  }

  return (
    <Snackbar
      closeIconAriaLabel={translate('Action.Close')}
      data-testid='genericSnackBar'
      icon={SEVERITY_ICON[severity]}
      onClose={handleClose}
      shouldAutoDismiss
      title={message}
    />
  );
});

export default GenericSnackBar;

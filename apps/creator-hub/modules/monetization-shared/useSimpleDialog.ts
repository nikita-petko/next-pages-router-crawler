import { useCallback, useMemo, useState } from 'react';

export type UseSimpleDialogParams = {
  initialIsOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
};

/**
 * Utiltiy hook for managing dialog state.
 */
export function useSimpleDialog({
  initialIsOpen = false,
  onOpen,
  onClose,
}: UseSimpleDialogParams = {}) {
  const [isOpen, setIsOpen] = useState(initialIsOpen);

  const open = useCallback(() => {
    setIsOpen(true);
    onOpen?.();
  }, [onOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  return useMemo(() => ({ isOpen, open, close }), [isOpen, close, open]);
}

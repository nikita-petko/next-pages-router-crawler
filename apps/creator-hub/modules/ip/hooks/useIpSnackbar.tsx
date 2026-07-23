import React, { useCallback } from 'react';
import { Alert, TSnackbarProps, useSnackbar } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { toastDurationTime } from '@modules/miscellaneous/common';

const defaults: TSnackbarProps = {
  anchorOrigin: { vertical: 'top', horizontal: 'center' },
  autoHide: true,
  autoHideDuration: toastDurationTime,
};

/**
 * Convenience hook for working with snackbars in the agreements manager
 */
const useIpSnackbar = () => {
  const { enqueue } = useSnackbar();
  const { translate } = useTranslation();

  const enqueueErrorSnackbar = useCallback(
    (errorKey: string = 'Error.LoadingData') => {
      enqueue({
        children: <Alert severity='error'>{translate(errorKey)}</Alert>,
        ...defaults,
      });
    },
    [enqueue, translate],
  );

  const enqueueSuccessSnackbar = useCallback(
    (successKey: string, vars?: Record<string, string>) => {
      enqueue({
        children: <Alert severity='success'>{translate(successKey, vars)}</Alert>,
        ...defaults,
      });
    },
    [enqueue, translate],
  );

  const enqueueWithDefaults: typeof enqueue = useCallback(
    (props) => {
      enqueue({ ...defaults, ...props });
    },
    [enqueue],
  );

  return {
    /**
     * Shows a error snackbar. The default message is `Error.LoadingData` which is
     * suitable for general API errors. You can also pass in a custom key for a
     * different error message.
     */
    enqueueErrorSnackbar,
    /** Shows a success snackbar with the provided translation key */
    enqueueSuccessSnackbar,
    /**
     * Convenience method that provides default snackbar behavior. Useful for
     * custom alerts/content.
     */
    enqueueWithDefaults,
  };
};

export default useIpSnackbar;

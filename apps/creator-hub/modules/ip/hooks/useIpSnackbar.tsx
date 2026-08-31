import React, { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import type { TSnackbarProps } from '@rbx/ui';
import { Alert, useSnackbar } from '@rbx/ui';
import { toastDurationTime } from '@modules/miscellaneous/common';

const defaults: TSnackbarProps = {
  anchorOrigin: { vertical: 'top', horizontal: 'center' },
  autoHide: true,
  autoHideDuration: toastDurationTime,
};

const NEUTRAL_SNACKBAR_CLASS =
  '[background-color:#fff] [color:#1b1b1f] radius-medium padding-y-medium padding-x-large text-body-medium text-align-x-center [box-shadow:0px_6px_16px_rgba(0,0,0,0.24)]';

/**
 * Shows a bottom-center confirmation toast. Pass an already-translated message.
 */
export const useNeutralIpSnackbar = () => {
  const { enqueue } = useSnackbar();

  return useCallback(
    (message: string) => {
      enqueue({
        ...defaults,
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
        children: (
          <div role='alert' className={NEUTRAL_SNACKBAR_CLASS}>
            {message}
          </div>
        ),
      });
    },
    [enqueue],
  );
};

/**
 * Convenience hook for working with snackbars in the agreements manager
 */
const useIpSnackbar = () => {
  const { enqueue } = useSnackbar();
  const { translate } = useTranslation();

  const enqueueErrorSnackbar = useCallback(
    (errorKey = 'Error.LoadingData') => {
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

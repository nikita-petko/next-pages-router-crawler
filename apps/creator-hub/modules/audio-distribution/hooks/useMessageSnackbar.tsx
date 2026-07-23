import React, { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import { Alert, useSnackbar } from '@rbx/ui';

const useMessageSnackbar = () => {
  const { enqueue } = useSnackbar();
  const { translate } = useTranslation();

  const showError = useCallback(
    (errorText?: string) => {
      if (enqueue) {
        enqueue(
          {
            anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
            autoHide: false,
            children: (
              <Alert severity='error'>{errorText ?? translate('Response.UnknownError')}</Alert>
            ),
          },
          (reason) => reason === 'timeout',
        );
      }
    },
    [enqueue, translate],
  );

  return { showError };
};

export default useMessageSnackbar;

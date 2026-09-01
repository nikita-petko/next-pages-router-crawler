import React, { useCallback } from 'react';
import { useSnackbar } from '@rbx/ui';
import { toastDurationTime } from '../../translation/constants';

const useTranslationToast = () => {
  const { enqueue } = useSnackbar();

  const showSuccessToast = useCallback(
    (successText: string) => {
      if (enqueue) {
        enqueue(
          {
            message: successText,
            anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
            autoHide: true,
          },
          (reason) => reason === 'timeout',
        );
      }
    },
    [enqueue],
  );

  const showFailureToast = useCallback(
    (failureText: string) => {
      if (enqueue) {
        enqueue(
          {
            message: failureText,
            anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
            autoHide: true,
          },
          (reason) => reason === 'timeout',
        );
      }
    },
    [enqueue],
  );

  return {
    showSuccessToast,
    showFailureToast,
  };
};

export default useTranslationToast;

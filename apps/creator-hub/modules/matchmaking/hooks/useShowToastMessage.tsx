import React, { useCallback } from 'react';
import { Alert, AlertTitle, useSnackbar } from '@rbx/ui';

const useShowToastMessage = () => {
  const { enqueue } = useSnackbar();

  const showSuccessToast = useCallback(
    (
      successText: string,
      translate: (
        key: string,
        args?:
          | {
              [key: string]: string;
            }
          | undefined,
      ) => string,
    ) => {
      if (enqueue) {
        enqueue(
          {
            children: (
              <Alert severity='success'>
                <AlertTitle>{translate('Message.Success')}</AlertTitle>
                {translate(successText)}
              </Alert>
            ),
            anchorOrigin: { vertical: 'top', horizontal: 'center' },
            autoHide: true,
          },
          (reason) => reason === 'timeout',
        );
      }
    },
    [enqueue],
  );

  const showFailureToast = useCallback(
    (
      failureText: string,
      translate: (
        key: string,
        args?:
          | {
              [key: string]: string;
            }
          | undefined,
      ) => string,
    ) => {
      if (enqueue) {
        enqueue(
          {
            children: (
              <Alert severity='error'>
                <AlertTitle>{translate('Message.Error')}</AlertTitle>
                {translate(failureText)}
              </Alert>
            ),
            message: failureText,
            anchorOrigin: { vertical: 'top', horizontal: 'center' },
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

export default useShowToastMessage;

import React, { useCallback } from 'react';
import { Alert, AlertTitle, useSnackbar } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';

function useQuestionnaireToast() {
  const { enqueue, close: closeSnackbar } = useSnackbar();
  const { translate } = useTranslation();

  const showToastNetworkError = useCallback(
    (status: number) => {
      if (translate) {
        enqueue({
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'center',
          },
          children: (
            <Alert severity='error'>
              <AlertTitle>{translate('Title.NetworkError')}</AlertTitle>
              {translate('Message.NetworkError', { status: `${status}` })}
            </Alert>
          ),
          autoHide: true,
          onClose: closeSnackbar,
        });
      }
    },
    [closeSnackbar, enqueue, translate],
  );

  const showToastUserError = useCallback(
    (titleKey: string, messageKey: string) => {
      if (translate) {
        enqueue({
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'center',
          },
          children: (
            <Alert severity='error'>
              <AlertTitle>{translate(titleKey)}</AlertTitle>
              {translate(messageKey)}
            </Alert>
          ),
          autoHide: true,
          onClose: closeSnackbar,
        });
      }
    },
    [closeSnackbar, enqueue, translate],
  );

  const showToastSuccess = useCallback(
    (isSubmit: boolean) => {
      if (translate) {
        enqueue({
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'center',
          },
          children: (
            <Alert severity='success'>
              <AlertTitle>{translate('Title.SubmitSuccess')}</AlertTitle>
              {translate(isSubmit ? 'Message.SubmitSuccess' : 'Message.SaveSuccess')}
            </Alert>
          ),
          autoHide: true,
          onClose: closeSnackbar,
        });
      }
    },
    [closeSnackbar, enqueue, translate],
  );

  return {
    showToastNetworkError,
    showToastUserError,
    showToastSuccess,
  };
}

export default useQuestionnaireToast;

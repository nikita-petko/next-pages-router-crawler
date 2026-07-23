import React, { useCallback } from 'react';
import { Alert, AlertTitle, makeStyles, useSnackbar } from '@rbx/ui';
import { toastDurationTime } from '@modules/miscellaneous/common';

const usePaymentSentToastStyles = makeStyles()(() => ({
  root: {
    padding: 0,
    backgroundColor: 'transparent !important',
    boxShadow: 'none !important',
    minWidth: '0 !important',
  },

  message: {
    padding: 0,
    backgroundColor: 'transparent !important',
    width: 'fit-content !important',
    margin: '0 auto',
    minWidth: '0 !important',
  },
}));

const usePaymentSentToast = () => {
  const { classes } = usePaymentSentToastStyles();
  const { enqueue, close } = useSnackbar();

  return useCallback(
    (title: string) => {
      enqueue({
        ContentProps: { classes: { root: classes.root, message: classes.message } },
        message: (
          <Alert
            data-testid='success-message-v2'
            variant='standard'
            severity='success'
            sx={{
              '&.MuiAlert-standardSuccess': {
                backgroundColor: 'common.white',
                color: 'common.black',
                alignItems: 'center',
              },
              '& .MuiAlert-message': {
                color: 'common.black',
                display: 'flex',
                alignItems: 'center',
                padding: 0,
              },
              '& .MuiAlertTitle-root': {
                color: 'common.black',
                margin: 0,
                lineHeight: 'inherit',
              },
              '& .MuiAlert-icon': {
                marginRight: 1,
                padding: 0,
                alignItems: 'center',
              },
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 2,
              width: 'fit-content',
              maxWidth: 'min(90vw, 560px)',
              margin: '0 auto',
            }}>
            <AlertTitle>{title}</AlertTitle>
          </Alert>
        ),
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
        autoHideDuration: toastDurationTime,
        autoHide: true,
        onClose: close,
      });
    },
    [classes.message, classes.root, close, enqueue],
  );
};

export default usePaymentSentToast;

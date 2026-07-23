import { useCallback } from 'react';
import { useSnackbar } from '@rbx/ui';

const useShowToastMessage = () => {
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

export default useShowToastMessage;

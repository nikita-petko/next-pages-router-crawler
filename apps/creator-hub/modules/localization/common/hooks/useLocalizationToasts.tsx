import { useCallback } from 'react';
import { useSnackbar } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';

function useLocalizationToasts() {
  const { enqueue } = useSnackbar();
  const { translate } = useTranslation();

  const showToastNetworkError = useCallback(
    (status: number) => {
      if (translate) {
        enqueue(
          {
            message: `${translate('Message.NetworkError')}: ${status}`,
            autoHide: true,
          },
          (reason) => reason === 'timeout',
        );
      }
    },
    [enqueue, translate],
  );

  const showToastUnknownError = useCallback(
    (consoleMessage: string) => {
      if (enqueue) {
        enqueue(
          {
            message: translate('Heading.UnknownError'),
            autoHide: true,
          },
          (reason) => reason === 'timeout',
        );
      }
      // eslint-disable-next-line no-console
      console.error(consoleMessage);
    },
    [enqueue, translate],
  );

  const showToastSuccess = useCallback(
    (isSubmit: boolean) => {
      if (enqueue) {
        enqueue(
          {
            message: translate(isSubmit ? 'Message.SubmitSuccess' : 'Message.SaveSuccess'),
            autoHide: true,
          },
          (reason) => reason === 'timeout',
        );
      }
    },
    [enqueue, translate],
  );

  return {
    showToastNetworkError,
    showToastUnknownError,
    showToastSuccess,
  };
}

export default useLocalizationToasts;

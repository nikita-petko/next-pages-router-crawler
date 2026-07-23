import { creatorSettingsClient } from '@modules/clients';
import { useTranslation } from '@rbx/intl';
import { useEffect, useState } from 'react';
import useSnackbarNotificationMessage from '../useSnackbarNotificationMessage';
import { UnsubscribeParams } from './useUnsubscribeQuery';

const useValidateUnsubscribeRequest = (
  unsubscribeParams: UnsubscribeParams | null,
  isReady: boolean,
) => {
  const [isValid, setIsValid] = useState(false);
  const [validatingRequest, setIsValidatingRequest] = useState(true);
  const { translate } = useTranslation();
  const showSnackbarMessage = useSnackbarNotificationMessage();

  useEffect(() => {
    const isValidQuery = async (params: UnsubscribeParams | null) => {
      if (!params) {
        setIsValid(false);
        return;
      }

      try {
        await creatorSettingsClient.validateUnsubscribeRequest(
          params.hash,
          params.userId,
          params.notificationType,
        );
        setIsValid(true);
      } catch {
        showSnackbarMessage('error', translate('Error.ValidatingUnsubscribe'));
      } finally {
        setIsValidatingRequest(false);
      }
    };

    if (isReady && unsubscribeParams) {
      isValidQuery(unsubscribeParams);
    }

    if (isReady && !unsubscribeParams) {
      setIsValidatingRequest(false);
    }
  }, [isReady, showSnackbarMessage, translate, unsubscribeParams]);

  return { isValid, validatingRequest };
};

export default useValidateUnsubscribeRequest;

import { useEffect, useRef } from 'react';
import networkRequestManager from '../implementations/QuestionnaireNetworkRequestManager';
import useQuestionnaireToast from './useQuestionnaireToast';

/**
 * Reports a React Query error through the questionnaire toasts, once per distinct error.
 *
 * The ref guard is load-bearing: `showToast*` identities change when translations load, so without
 * it the effect re-runs and re-toasts the same failure.
 */
const useQuestionnaireErrorToast = (error: unknown): void => {
  const { showToastNetworkError, showToastUserError } = useQuestionnaireToast();
  const toastedError = useRef<unknown>(null);

  useEffect(() => {
    if (error == null || toastedError.current === error) {
      return;
    }

    toastedError.current = error;
    networkRequestManager.handleNetworkRequestFailure(
      error,
      showToastUserError,
      showToastNetworkError,
    );
  }, [error, showToastNetworkError, showToastUserError]);
};

export default useQuestionnaireErrorToast;

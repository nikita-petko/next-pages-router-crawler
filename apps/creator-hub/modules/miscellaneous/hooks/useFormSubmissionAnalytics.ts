import { useCallback, useMemo } from 'react';
import { useUnifiedLoggerProvider } from './UnifiedLoggerProvider';

export type FormSubmissionAnalytics = {
  started: () => void;
  succeeded: () => void;
  failed: () => void;
};

const useFormSubmissionAnalytics = (formName: string): FormSubmissionAnalytics => {
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const parameters = useMemo(() => ({ form_name: formName }), [formName]);

  const started = useCallback(() => {
    unifiedLogger.logFormVitalsEvent({
      eventName: 'form_submission_started',
      parameters,
    });
  }, [parameters, unifiedLogger]);

  const succeeded = useCallback(() => {
    unifiedLogger.logFormVitalsEvent({
      eventName: 'form_submission_succeeded',
      parameters,
    });
  }, [parameters, unifiedLogger]);

  const failed = useCallback(() => {
    unifiedLogger.logFormVitalsEvent({
      eventName: 'form_submission_failed',
      parameters,
    });
  }, [parameters, unifiedLogger]);

  return useMemo(
    () => ({
      started,
      succeeded,
      failed,
    }),
    [failed, started, succeeded],
  );
};

export default useFormSubmissionAnalytics;

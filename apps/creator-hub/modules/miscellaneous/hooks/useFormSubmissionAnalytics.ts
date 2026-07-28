import { useCallback, useMemo } from 'react';
import { useUnifiedLoggerProvider } from './UnifiedLoggerProvider';

export const FormSubmissionEventName = {
  Started: 'form_submission_started',
  Succeeded: 'form_submission_succeeded',
  Failed: 'form_submission_failed',
} as const;

export type FormSubmissionAnalytics = {
  started: () => void;
  succeeded: () => void;
  failed: () => void;
};

const useFormSubmissionAnalytics = (formName: string): FormSubmissionAnalytics => {
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const parameters = useMemo(() => ({ form_name: formName }), [formName]);

  const started = useCallback(() => {
    unifiedLogger.logClickEvent({
      eventName: FormSubmissionEventName.Started,
      parameters,
    });
  }, [parameters, unifiedLogger]);

  const succeeded = useCallback(() => {
    unifiedLogger.logImpressionEvent({
      eventName: FormSubmissionEventName.Succeeded,
      parameters,
    });
  }, [parameters, unifiedLogger]);

  const failed = useCallback(() => {
    unifiedLogger.logErrorEvent({
      eventName: FormSubmissionEventName.Failed,
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

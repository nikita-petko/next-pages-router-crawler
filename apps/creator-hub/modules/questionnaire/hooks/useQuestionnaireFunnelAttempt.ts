import { useCallback, useState } from 'react';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import {
  clearQuestionnaireAttemptId,
  getOrCreateQuestionnaireAttemptId,
  getQuestionnaireEntryPoint,
  logQuestionnaireCompleted,
  logQuestionnaireStarted,
} from '../utils/questionnaireEvents';

interface UseQuestionnaireFunnelAttemptOptions {
  explicitEntryPoint?: string;
  locale: string | null;
  questionnaireId: string | undefined;
  universeId: number;
}

interface StartAttemptOptions {
  onStarted?: () => void;
}

interface UseQuestionnaireFunnelAttemptResult {
  attemptId: string;
  completeAttempt: () => void;
  entryPoint: string;
  startAttempt: (options?: StartAttemptOptions) => boolean;
}

const useQuestionnaireFunnelAttempt = ({
  explicitEntryPoint,
  locale,
  questionnaireId,
  universeId,
}: UseQuestionnaireFunnelAttemptOptions): UseQuestionnaireFunnelAttemptResult => {
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const [attemptId, setAttemptId] = useState('');
  const [entryPoint, setEntryPoint] = useState('');

  const startAttempt = useCallback(
    (options?: StartAttemptOptions): boolean => {
      if (!questionnaireId) {
        return false;
      }
      const nextAttemptId = getOrCreateQuestionnaireAttemptId(universeId, questionnaireId);
      const nextEntryPoint = getQuestionnaireEntryPoint(explicitEntryPoint);

      setAttemptId(nextAttemptId);
      setEntryPoint(nextEntryPoint);
      logQuestionnaireStarted(unifiedLogger, {
        attemptId: nextAttemptId,
        entryPoint: nextEntryPoint,
        locale,
        questionnaireId,
        universeId,
      });
      options?.onStarted?.();
      return true;
    },
    [explicitEntryPoint, locale, questionnaireId, unifiedLogger, universeId],
  );

  const completeAttempt = useCallback(() => {
    if (questionnaireId) {
      logQuestionnaireCompleted(unifiedLogger, {
        attemptId,
        entryPoint,
        locale,
        questionnaireId,
        universeId,
      });
      clearQuestionnaireAttemptId(universeId, questionnaireId);
    }
    setAttemptId('');
  }, [attemptId, entryPoint, locale, questionnaireId, unifiedLogger, universeId]);

  return { attemptId, completeAttempt, entryPoint, startAttempt };
};

export default useQuestionnaireFunnelAttempt;

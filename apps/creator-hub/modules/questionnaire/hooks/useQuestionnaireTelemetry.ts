import { useCallback, useMemo } from 'react';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import type { QuestionnaireTelemetryContextValue } from '../contexts/QuestionnaireTelemetryContext';
import {
  logQuestionnaireQuestionViewed,
  logQuestionnaireSectionViewed,
} from '../utils/questionnaireEvents';

interface UseQuestionnaireTelemetryOptions {
  attemptId: string;
  entryPoint: string;
  locale: string | null;
  questionnaireId?: string;
  universeId: number;
}

const useQuestionnaireTelemetry = ({
  attemptId,
  entryPoint,
  locale,
  questionnaireId,
  universeId,
}: UseQuestionnaireTelemetryOptions): QuestionnaireTelemetryContextValue => {
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const onSectionViewed = useCallback<
    NonNullable<QuestionnaireTelemetryContextValue['onSectionViewed']>
  >(
    (sectionId, timing) => {
      if (!questionnaireId) {
        return;
      }
      logQuestionnaireSectionViewed(
        unifiedLogger,
        { attemptId, entryPoint, locale, questionnaireId, universeId },
        sectionId,
        timing,
      );
    },
    [attemptId, entryPoint, locale, questionnaireId, unifiedLogger, universeId],
  );

  const onQuestionViewed = useCallback<
    NonNullable<QuestionnaireTelemetryContextValue['onQuestionViewed']>
  >(
    (questionId, timing) => {
      if (!questionnaireId) {
        return;
      }
      logQuestionnaireQuestionViewed(
        unifiedLogger,
        { attemptId, entryPoint, locale, questionnaireId, universeId },
        questionId,
        timing,
      );
    },
    [attemptId, entryPoint, locale, questionnaireId, unifiedLogger, universeId],
  );

  return useMemo(
    () => ({ onQuestionViewed, onSectionViewed }),
    [onQuestionViewed, onSectionViewed],
  );
};

export default useQuestionnaireTelemetry;

import { uuidService } from '@rbx/core';
import type { UnifiedLogger } from '@rbx/unified-logger';

export const QUESTIONNAIRE_STARTED_EVENT = 'QuestionnaireStarted';
export const SECTION_VIEWED_EVENT = 'SectionViewed';
export const QUESTION_VIEWED_EVENT = 'QuestionViewed';

const ATTEMPT_STORAGE_KEY_PREFIX = 'creator-hub:questionnaire-attempt';
const DIRECT_ENTRY_POINT = 'direct';
const UNKNOWN_ENTRY_POINT = 'unknown';
const WEB_PLATFORM = 'web';

export type QuestionnaireTelemetryLogger = Pick<UnifiedLogger, 'logImpressionEvent'>;

export interface QuestionnaireEventContext {
  attemptId: string;
  entryPoint: string;
  locale: string | null;
  questionnaireId: string;
  universeId: number;
}

export interface QuestionnaireViewTiming {
  clientTimestamp: string;
  durationMs: number;
}

const getAttemptStorageKey = (universeId: number, questionnaireId: string): string =>
  `${ATTEMPT_STORAGE_KEY_PREFIX}:${universeId}:${questionnaireId}`;

const getCommonParameters = (
  context: QuestionnaireEventContext,
  clientTimestamp: string,
): Record<string, string> => ({
  attempt_id: context.attemptId,
  entry_point: context.entryPoint,
  event_timestamp: clientTimestamp,
  locale: context.locale ?? UNKNOWN_ENTRY_POINT,
  platform: WEB_PLATFORM,
  questionnaire_id: context.questionnaireId,
  // The API exposes an immutable questionnaire ID but no separate version field.
  questionnaire_version: context.questionnaireId,
  universe_id: String(context.universeId),
});

export const logQuestionnaireStarted = (
  logger: QuestionnaireTelemetryLogger,
  context: QuestionnaireEventContext,
): void => {
  logger.logImpressionEvent({
    eventName: QUESTIONNAIRE_STARTED_EVENT,
    parameters: getCommonParameters(context, new Date().toISOString()),
  });
};

export const logQuestionnaireSectionViewed = (
  logger: QuestionnaireTelemetryLogger,
  context: QuestionnaireEventContext,
  sectionId: string,
  timing: QuestionnaireViewTiming,
): void => {
  logger.logImpressionEvent({
    eventName: SECTION_VIEWED_EVENT,
    parameters: {
      ...getCommonParameters(context, timing.clientTimestamp),
      duration_ms: String(Math.max(Math.round(timing.durationMs), 0)),
      section_id: sectionId,
    },
  });
};

export const logQuestionnaireQuestionViewed = (
  logger: QuestionnaireTelemetryLogger,
  context: QuestionnaireEventContext,
  questionId: string,
  timing: QuestionnaireViewTiming,
): void => {
  logger.logImpressionEvent({
    eventName: QUESTION_VIEWED_EVENT,
    parameters: {
      ...getCommonParameters(context, timing.clientTimestamp),
      duration_ms: String(Math.max(Math.round(timing.durationMs), 0)),
      question_id: questionId,
    },
  });
};

export const getOrCreateQuestionnaireAttemptId = (
  universeId: number,
  questionnaireId: string,
): string => {
  const storageKey = getAttemptStorageKey(universeId, questionnaireId);

  try {
    const storedAttemptId = window.localStorage.getItem(storageKey);
    if (storedAttemptId) {
      return storedAttemptId;
    }
  } catch {
    // Storage can be unavailable in private browsing or restricted browser contexts.
  }

  const attemptId = uuidService.generateRandomUuid();
  try {
    window.localStorage.setItem(storageKey, attemptId);
  } catch {
    // The in-memory ID still correlates events for the current page lifetime.
  }
  return attemptId;
};

export const clearQuestionnaireAttemptId = (universeId: number, questionnaireId: string): void => {
  try {
    window.localStorage.removeItem(getAttemptStorageKey(universeId, questionnaireId));
  } catch {
    // There is nothing else to clear when storage is unavailable.
  }
};

export const getQuestionnaireEntryPoint = (
  explicitEntryPoint?: string,
  referrer = typeof document === 'undefined' ? '' : document.referrer,
): string => {
  if (explicitEntryPoint) {
    return explicitEntryPoint;
  }
  if (!referrer) {
    return DIRECT_ENTRY_POINT;
  }

  try {
    const referrerUrl = new URL(referrer);
    if (typeof window !== 'undefined' && referrerUrl.origin === window.location.origin) {
      return referrerUrl.pathname;
    }
    return referrerUrl.hostname || UNKNOWN_ENTRY_POINT;
  } catch {
    return UNKNOWN_ENTRY_POINT;
  }
};

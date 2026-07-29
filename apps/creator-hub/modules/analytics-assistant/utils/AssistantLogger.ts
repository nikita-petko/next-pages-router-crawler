import type { UnifiedLogger } from '@rbx/unified-logger';
import {
  logAnalyticsApiVitalsEvent,
  logAnalyticsClickEvent,
  logAnalyticsErrorEvent,
  logAnalyticsImpressionEvent,
} from '@modules/experience-analytics-shared/utils/analyticsEventLogger';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';

export enum AssistantImpressionEventName {
  AssistantReportImpression = 'analytics/assistant/reportImpression',
  AssistantReportSectionImpression = 'analytics/assistant/reportSectionImpression',
  AssistantReportProductRecommendationImpression = 'analytics/assistant/reportProductRecommendationImpression',
  AssistantReportSeeMoreImpression = 'analytics/assistant/reportSeeMoreImpression',
  AssistantInsightEntrypointImpression = 'analytics/assistant/insightEntrypointImpression',
  AssistantChatArtifactImpression = 'analytics/assistant/chatArtifactImpression',
  AssistantAskQuestionImpression = 'analytics/assistant/askQuestionImpression',
}

export enum AssistantClickEventName {
  AssistantReportSectionClick = 'analytics/assistant/reportSectionClick',
  AssistantHistoricalReportSelect = 'analytics/assistant/historicalReportSelect',
  AssistantReportFeedback = 'analytics/assistant/reportFeedback',
  AssistantChatFeedback = 'analytics/assistant/chatFeedback',
  AssistantReportProductRecommendationClick = 'analytics/assistant/reportProductRecommendationClick',
  AssistantReportProductRecommendationDismiss = 'analytics/assistant/reportProductRecommendationDismiss',
  AssistantReportProductRecommendationAlreadyImplemented = 'analytics/assistant/reportProductRecommendationAlreadyImplemented',
  ViewPlayerFeedbackClick = 'analytics/assistant/viewPlayerFeedbackClick',
  AssistantInsightEntrypointSnooze = 'analytics/assistant/insightEntrypointSnooze',
  AssistantInsightEntrypointPrimaryCTA = 'analytics/assistant/insightEntrypointPrimaryCTA',
  AssistantChatMessageSend = 'analytics/assistant/chatMessageSend',
  AssistantChatStarterCardClick = 'analytics/assistant/chatStarterCardClick',
  AssistantChatStop = 'analytics/assistant/chatStop',
  AssistantChatArtifactInteract = 'analytics/assistant/chatArtifactInteract',
  AssistantChatArtifactExport = 'analytics/assistant/chatArtifactExport',
  AssistantAskQuestionAnswer = 'analytics/assistant/askQuestionAnswer',
}

// Performance/latency telemetry. Routed to the `apivitals` event type so it
// feeds performance monitoring rather than user-interaction (click) analytics.
export enum AssistantApiVitalsEventName {
  AssistantChatResponseComplete = 'analytics/assistant/chatResponseComplete',
}

// Failure telemetry. Routed to the `error` event type so it feeds error
// dashboards/alerting rather than click analytics.
export enum AssistantErrorEventName {
  AssistantChatError = 'analytics/assistant/chatError',
}

export type AssistantEventName =
  | AssistantImpressionEventName
  | AssistantClickEventName
  | AssistantApiVitalsEventName
  | AssistantErrorEventName;

/**
 * Common envelope attached to every chat-surface event so chat engagement can
 * be sliced consistently and separated from the summary-report surface.
 * `sessionId` is added automatically by the UnifiedLogger, so it is not here.
 */
export interface ChatEventEnvelope extends Record<string, string | number | boolean | Date> {
  universeId: number;
  /** Empty string before the backend conversation has been created. */
  conversationId: string;
  surface: 'chat';
  isReadOnly: boolean;
  /** Zero-based position of the turn within the conversation. */
  turnIndex: number;
}

export const buildChatEventEnvelope = ({
  universeId,
  conversationId,
  isReadOnly,
  turnIndex,
}: {
  universeId: number;
  conversationId?: string;
  isReadOnly: boolean;
  turnIndex: number;
}): ChatEventEnvelope => ({
  universeId,
  conversationId: conversationId ?? '',
  surface: 'chat',
  isReadOnly,
  turnIndex,
});

export const logAssistantEvent = <T extends Record<string, string | number | boolean | Date>>(
  client: UnifiedLogger,
  eventName: AssistantEventName,
  params: T,
) => {
  if (isValidEnumValue(AssistantImpressionEventName, eventName)) {
    logAnalyticsImpressionEvent(client, eventName, params);
    return;
  }
  if (isValidEnumValue(AssistantClickEventName, eventName)) {
    logAnalyticsClickEvent(client, eventName, params);
    return;
  }
  if (isValidEnumValue(AssistantApiVitalsEventName, eventName)) {
    logAnalyticsApiVitalsEvent(client, eventName, params);
    return;
  }
  if (isValidEnumValue(AssistantErrorEventName, eventName)) {
    logAnalyticsErrorEvent(client, eventName, params);
    return;
  }

  throw new Error(`Invalid event: ${String(eventName)}`);
};

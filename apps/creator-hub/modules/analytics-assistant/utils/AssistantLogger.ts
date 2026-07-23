import { UnifiedLogger } from '@rbx/unified-logger';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import {
  logAnalyticsImpressionEvent,
  logAnalyticsClickEvent,
} from '@modules/experience-analytics-shared';

export enum AssistantImpressionEventName {
  AssistantReportImpression = 'analytics/assistant/reportImpression',
  AssistantReportSectionImpression = 'analytics/assistant/reportSectionImpression',
  AssistantReportProductRecommendationImpression = 'analytics/assistant/reportProductRecommendationImpression',
  AssistantReportSeeMoreImpression = 'analytics/assistant/reportSeeMoreImpression',
  AssistantInsightEntrypointImpression = 'analytics/assistant/insightEntrypointImpression',
}

export enum AssistantClickEventName {
  AssistantReportSectionClick = 'analytics/assistant/reportSectionClick',
  AssistantHistoricalReportSelect = 'analytics/assistant/historicalReportSelect',
  AssistantReportFeedback = 'analytics/assistant/reportFeedback',
  AssistantReportProductRecommendationClick = 'analytics/assistant/reportProductRecommendationClick',
  AssistantReportProductRecommendationDismiss = 'analytics/assistant/reportProductRecommendationDismiss',
  AssistantReportProductRecommendationAlreadyImplemented = 'analytics/assistant/reportProductRecommendationAlreadyImplemented',
  ViewPlayerFeedbackClick = 'analytics/assistant/viewPlayerFeedbackClick',
  AssistantInsightEntrypointSnooze = 'analytics/assistant/insightEntrypointSnooze',
  AssistantInsightEntrypointPrimaryCTA = 'analytics/assistant/insightEntrypointPrimaryCTA',
}

export type AssistantEventName = AssistantImpressionEventName | AssistantClickEventName;

export const logAssistantEvent = <T extends Record<string, string | number | boolean | Date>>(
  client: UnifiedLogger,
  eventName: AssistantEventName,
  params: T,
) => {
  const isImpressionEvent = isValidEnumValue(AssistantImpressionEventName, eventName);
  const isClickEvent = isValidEnumValue(AssistantClickEventName, eventName);

  if (!isImpressionEvent && !isClickEvent) {
    throw new Error(`Invalid event: ${eventName}`);
  }

  if (isImpressionEvent) {
    logAnalyticsImpressionEvent(client, eventName, params);
  } else {
    logAnalyticsClickEvent(client, eventName, params);
  }
};

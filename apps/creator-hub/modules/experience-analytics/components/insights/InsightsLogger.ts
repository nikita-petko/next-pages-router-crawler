import type { UnifiedLogger } from '@rbx/unified-logger';
import getAnalyticsMetricDisplayConfig from '@modules/experience-analytics-shared/constants/AnalyticsMetricDisplayConfig';
import type { TRAQIV2NumericUIMetric } from '@modules/experience-analytics-shared/constants/AnalyticsMetricDisplayConfig';
import type RAQIV2PredefinedChartKey from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartKey';
import type { AchievementChartKeys } from '@modules/experience-analytics-shared/types/achievements';
import { InsightTypeV2 } from '@modules/experience-analytics-shared/types/insights';
import computeRAQIV2LoggingMetricOverride from '@modules/experience-analytics-shared/utils/computeRAQIV2LoggingMetricOverride';

// NOTE(gperkins@ 20230522) only exported for tests, please use wrapper functions
export enum InsightsEventName {
  CardImpression = 'analytics/insights/cardImpression',
  ClickEmbeddedLink = 'analytics/insights/clickEmbeddedLink',
  ClickPrimaryLink = 'analytics/insights/clickPrimaryLink',
  ClickSeeMoreToggle = 'analytics/insights/clickSeeMoreToggle',
  ClickTakeActionDocsClick = 'analytics/insights/clickTakeActionDocsClick',
  ClickSnooze = 'analytics/insights/clickSnooze',

  // v2 only
  ClickViewAchievement = 'analytics/insights/clickViewAchievement',
  AchievementCardImpression = 'analytics/insights/achievementCardImpression',
  ClickSnoozeV2 = 'analytics/insights/clickSnoozeV2',
  ClickQualitySignalCard = 'analytics/insights/clickQualitySignalCard',
  QualitySignalCardsImpression = 'analytics/insights/qualitySignalCardsImpression',
}

export const toUTCCalendarDay = (date: Date): string => {
  const offsetMillis = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMillis).toISOString().slice(0, 10);
};

// for insights v2
type InsightV2LinkLogFields = {
  universeId: number;
  insightType: InsightTypeV2;
  lastGenerated: Date;
  linkURL: string;
  metric: TRAQIV2NumericUIMetric;
  chartKey: RAQIV2PredefinedChartKey;
};

export const logInsightsV2EmbeddedLinkClick = (
  client: UnifiedLogger,
  logData: InsightV2LinkLogFields,
) => {
  const { universeId, insightType, lastGenerated, linkURL, metric, chartKey } = logData;
  const { loggingMetricOverride } = getAnalyticsMetricDisplayConfig(metric);
  client.logClickEvent({
    eventName: InsightsEventName.ClickEmbeddedLink, // reuse the same event name as insights v1
    parameters: {
      universe_id: `${universeId}`,
      insight_type: insightType,
      last_generated_utc: toUTCCalendarDay(lastGenerated),
      link_url: linkURL,
      metric: computeRAQIV2LoggingMetricOverride(metric, loggingMetricOverride),
      chart_key: chartKey,
    },
  });
};

export const logInsightsV2PrimaryLinkClick = (
  client: UnifiedLogger,
  logData: InsightV2LinkLogFields & { chartKey: RAQIV2PredefinedChartKey },
) => {
  const { universeId, insightType, lastGenerated, linkURL, metric, chartKey } = logData;
  const { loggingMetricOverride } = getAnalyticsMetricDisplayConfig(metric);
  client.logClickEvent({
    eventName: InsightsEventName.ClickPrimaryLink, // reuse the same event name as insights v1
    parameters: {
      universe_id: `${universeId}`,
      insight_type: insightType,
      last_generated_utc: toUTCCalendarDay(lastGenerated),
      link_url: linkURL,
      metric: computeRAQIV2LoggingMetricOverride(metric, loggingMetricOverride),
      chart_key: chartKey,
    },
  });
};

type InsightV2CardLogFields = {
  universeId: number;
  insightType: InsightTypeV2;
  lastGenerated: Date;
  metric: TRAQIV2NumericUIMetric;
  chartKey: RAQIV2PredefinedChartKey;
};

export const logInsightsV2Impression = (
  client: UnifiedLogger,
  { universeId, insightType, lastGenerated, metric, chartKey }: InsightV2CardLogFields,
) => {
  const eventName = InsightsEventName.CardImpression;
  const { loggingMetricOverride } = getAnalyticsMetricDisplayConfig(metric);
  client.logImpressionEvent({
    eventName,
    parameters: {
      universe_id: `${universeId}`,
      insight_type: insightType,
      last_generated_utc: toUTCCalendarDay(lastGenerated),
      metric: computeRAQIV2LoggingMetricOverride(metric, loggingMetricOverride),
      chart_key: chartKey,
    },
  });
};

export const logQualitySignalCardsImpression = (client: UnifiedLogger, universeId: number) => {
  const eventName = InsightsEventName.QualitySignalCardsImpression;
  client.logImpressionEvent({
    eventName,
    parameters: {
      universe_id: `${universeId}`,
      insight_type: InsightTypeV2.ExperienceQuality,
    },
  });
};

export const logClickViewAchievement = (
  client: UnifiedLogger,
  {
    universeId,
    type,
    chartKey,
  }: { universeId: number; type: InsightTypeV2; chartKey: RAQIV2PredefinedChartKey },
) => {
  client.logClickEvent({
    eventName: InsightsEventName.ClickViewAchievement,
    parameters: {
      universe_id: `${universeId}`,
      achievement_type: type,
      chart_key: chartKey,
    },
  });
};

export const logAchievementCardImpression = (
  client: UnifiedLogger,
  {
    universeId,
    type,
    chartKey,
  }: { universeId: number; type: InsightTypeV2; chartKey: AchievementChartKeys },
) => {
  client.logImpressionEvent({
    eventName: InsightsEventName.AchievementCardImpression,
    parameters: {
      universe_id: `${universeId}`,
      achievement_type: type,
      chart_key: chartKey,
    },
  });
};

export const logInsightsV2SnoozeClick = (
  client: UnifiedLogger,
  logData: InsightV2CardLogFields & { snoozeKey: string },
) => {
  const { universeId, insightType, lastGenerated, metric, snoozeKey } = logData;
  const { loggingMetricOverride } = getAnalyticsMetricDisplayConfig(metric);
  client.logClickEvent({
    eventName: InsightsEventName.ClickSnoozeV2,
    parameters: {
      universe_id: `${universeId}`,
      insight_type: insightType,
      last_generated_utc: toUTCCalendarDay(lastGenerated),
      metric: computeRAQIV2LoggingMetricOverride(metric, loggingMetricOverride),
      snooze_key: snoozeKey,
    },
  });
};

export const logQualitySignalsClick = (
  client: UnifiedLogger,
  {
    universeId,
    placeId,
    qualitySignalType,
  }: { universeId: number; placeId: number; qualitySignalType: string },
) => {
  client.logClickEvent({
    eventName: InsightsEventName.ClickQualitySignalCard,
    parameters: {
      universe_id: `${universeId}`,
      place_id: `${placeId}`,
      quality_signal_type: qualitySignalType,
    },
  });
};

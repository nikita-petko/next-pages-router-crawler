import type { UnifiedLogger } from '@rbx/unified-logger';
import getAnalyticsMetricDisplayConfig, {
  type TRAQIV2NumericUIMetric,
} from '@modules/experience-analytics-shared/constants/AnalyticsMetricDisplayConfig';
import computeRAQIV2LoggingMetricOverride from '@modules/experience-analytics-shared/utils/computeRAQIV2LoggingMetricOverride';

export enum OverviewEventName {
  // realtime section
  ClickRealtimeSeeMore = 'analytics/overview/clickSeeMoreRealtime',

  // benchmark score cards section
  ClickLearnHowToUseBenchmarks = 'analytics/overview/clickLearnHowToUseBenchmarks',
  ClickViewAllBenchmarks = 'analytics/overview/clickViewAllBenchmarks',
  ClickBenchmarkScoreCard = 'analytics/overview/clickBenchmarkScoreCard',
  ClickViewRFYSignals = 'analytics/overview/clickViewRFYSignals',

  // alerts section
  ClickOverviewAlertsViewAll = 'analytics/overview/clickAlertsViewAll',
  ClickOverviewAlertViewChart = 'analytics/overview/clickAlertViewChart',
  ClickOverviewNewPlaceVersionMonitor = 'analytics/overview/clickNewPlaceVersionMonitor',
}

export const logClickRealtimeSeeMore = (client: UnifiedLogger, universeId: number) => {
  const eventName = OverviewEventName.ClickRealtimeSeeMore;
  client.logClickEvent({
    eventName,
    parameters: {
      universe_id: `${universeId}`,
    },
  });
};

export const logClickBenchmarkScoreCard = (
  client: UnifiedLogger,
  universeId: number,
  metric: TRAQIV2NumericUIMetric,
) => {
  const eventName = OverviewEventName.ClickBenchmarkScoreCard;
  const { loggingMetricOverride } = getAnalyticsMetricDisplayConfig(metric);
  client.logClickEvent({
    eventName,
    parameters: {
      universe_id: `${universeId}`,
      metric: computeRAQIV2LoggingMetricOverride(metric, loggingMetricOverride),
    },
  });
};

export const logClickLearnHowToUseBenchmarks = (client: UnifiedLogger, universeId: number) => {
  const eventName = OverviewEventName.ClickLearnHowToUseBenchmarks;
  client.logClickEvent({
    eventName,
    parameters: {
      universe_id: `${universeId}`,
    },
  });
};

export const logClickViewAllBenchmarks = (client: UnifiedLogger, universeId: number) => {
  const eventName = OverviewEventName.ClickViewAllBenchmarks;
  client.logClickEvent({
    eventName,
    parameters: {
      universe_id: `${universeId}`,
    },
  });
};

export const logClickViewRFYSignals = (client: UnifiedLogger, universeId: number) => {
  const eventName = OverviewEventName.ClickViewRFYSignals;
  client.logClickEvent({
    eventName,
    parameters: {
      universe_id: `${universeId}`,
    },
  });
};

export const logClickOverviewAlertsViewAll = (client: UnifiedLogger, universeId: number) => {
  client.logClickEvent({
    eventName: OverviewEventName.ClickOverviewAlertsViewAll,
    parameters: {
      universe_id: `${universeId}`,
    },
  });
};

export const logClickOverviewAlertViewChart = (
  client: UnifiedLogger,
  universeId: number,
  alertId: string,
) => {
  client.logClickEvent({
    eventName: OverviewEventName.ClickOverviewAlertViewChart,
    parameters: {
      universe_id: `${universeId}`,
      alert_id: alertId,
    },
  });
};

export const logClickOverviewNewPlaceVersionMonitor = (
  client: UnifiedLogger,
  universeId: number,
  versionNumber: number,
) => {
  client.logClickEvent({
    eventName: OverviewEventName.ClickOverviewNewPlaceVersionMonitor,
    parameters: {
      universe_id: `${universeId}`,
      version_number: `${versionNumber}`,
    },
  });
};

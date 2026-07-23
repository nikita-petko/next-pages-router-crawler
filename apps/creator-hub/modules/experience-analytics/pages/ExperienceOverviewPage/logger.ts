import {
  computeRAQIV2LoggingMetricOverride,
  getAnalyticsMetricDisplayConfig,
  TRAQIV2NumericUIMetric,
} from '@modules/experience-analytics-shared';
import { UnifiedLogger } from '@rbx/unified-logger';

export enum OverviewEventName {
  // realtime section
  ClickRealtimeSeeMore = 'analytics/overview/clickSeeMoreRealtime',

  // benchmark score cards section
  ClickLearnHowToUseBenchmarks = 'analytics/overview/clickLearnHowToUseBenchmarks',
  ClickViewAllBenchmarks = 'analytics/overview/clickViewAllBenchmarks',
  ClickBenchmarkScoreCard = 'analytics/overview/clickBenchmarkScoreCard',
  ClickViewRFYSignals = 'analytics/overview/clickViewRFYSignals',
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

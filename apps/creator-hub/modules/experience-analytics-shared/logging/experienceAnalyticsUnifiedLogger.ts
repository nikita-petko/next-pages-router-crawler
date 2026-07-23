import type { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';
import type { UnifiedLogger } from '@rbx/unified-logger';
import type SingleDateType from '@modules/charts-generic/enums/SingleDateType';
import type { QueryParamGranularity } from '../context/AnalyticsCurrentGranularityProvider';
import type { AnalyticsHomeLoggingTarget } from './AnalyticsHomeLoggingTarget';
import type { LoggingTarget } from './LoggingTarget';
import loggingTargetToParameter from './loggingTargetToParameter';

export enum AnalyticsEventNames {
  PageRangeTypeChange = 'analytics/page/rangeTypeChange',
  PageRangeCustomStartChange = 'analytics/page/rangeCustomStartChange',
  PageRangeCustomEndChange = 'analytics/page/rangeCustomEndChange',
  PageDateTypeChange = 'analytics/page/dateTypeChange',
  PageGranularityChange = 'analytics/page/granularityChange',
  PageTabChange = 'analytics/page/tabChange',
  PageTabLoad = 'analytics/page/tabLoad',
  PageFilterDrawerButtonClick = 'analytics/click/filterDrawerButton',
  PageFilterDrawerButtonImpression = 'analytics/page/filterDrawerButtonImpression',
  MonetizationDiscoveryCardClick = 'analytics/click/monetizationDiscoveryCard',
  PageTabView = 'analytics/page/tabView',
  AnalyticsHomeWatchlistImpression = 'analytics/page/home/watchlistImpression',
  AnalyticsHomeExperiencesTableImpression = 'analytics/page/home/experiencesTableImpression',
}

export const logRangeTypeChange = (
  client: UnifiedLogger,
  {
    loggingTarget,
    oldRangeType,
    newRangeType,
  }: {
    loggingTarget?: LoggingTarget;
    oldRangeType: RAQIV2DateRangeType;
    newRangeType: RAQIV2DateRangeType;
  },
) => {
  const eventName = AnalyticsEventNames.PageRangeTypeChange;
  client.logClickEvent({
    eventName,
    parameters: {
      prior: oldRangeType,
      value: newRangeType,
      ...loggingTargetToParameter(loggingTarget),
    },
  });
};

export const logRangeCustomStartChange = (
  client: UnifiedLogger,
  {
    loggingTarget,
    oldStart,
    newStart,
    end,
  }: {
    loggingTarget?: LoggingTarget;
    oldStart: Date | null;
    newStart: Date | null;
    end: Date | null;
  },
) => {
  const eventName = AnalyticsEventNames.PageRangeCustomStartChange;
  const prior = oldStart ? oldStart.toISOString() : 'null';
  const value = newStart ? newStart.toISOString() : 'null';
  const resultRange = `${value} - ${end ? end.toISOString() : '?'}`;
  client.logClickEvent({
    eventName,
    parameters: {
      prior,
      value,
      resultRange,
      ...loggingTargetToParameter(loggingTarget),
    },
  });
};

export const logRangeCustomEndChange = (
  client: UnifiedLogger,
  {
    loggingTarget,
    oldEnd,
    newEnd,
    start,
  }: {
    loggingTarget?: LoggingTarget;
    oldEnd: Date | null;
    newEnd: Date | null;
    start: Date | null;
  },
) => {
  const eventName = AnalyticsEventNames.PageRangeCustomEndChange;
  const prior = oldEnd ? oldEnd.toISOString() : 'null';
  const value = newEnd ? newEnd.toISOString() : 'null';
  const resultRange = `${start ? start.toISOString() : '?'} - ${value}`;
  client.logClickEvent({
    eventName,
    parameters: {
      prior,
      value,
      resultRange,
      ...loggingTargetToParameter(loggingTarget),
    },
  });
};

export const logDateTypeChange = (
  client: UnifiedLogger,
  {
    loggingTarget,
    oldDateType,
    newDateType,
  }: { loggingTarget?: LoggingTarget; oldDateType: SingleDateType; newDateType: SingleDateType },
) => {
  const eventName = AnalyticsEventNames.PageDateTypeChange;
  client.logClickEvent({
    eventName,
    parameters: {
      prior: oldDateType,
      value: newDateType,
      ...loggingTargetToParameter(loggingTarget),
    },
  });
};

export const logTabChange = (
  client: UnifiedLogger,
  {
    loggingTarget,
    newTab,
    tabs,
  }: { loggingTarget?: LoggingTarget; newTab: string; tabs: Readonly<Array<string>> },
) => {
  const eventName = AnalyticsEventNames.PageTabChange;
  client.logClickEvent({
    eventName,
    parameters: {
      value: newTab,
      tabs: tabs.join(','),
      ...loggingTargetToParameter(loggingTarget),
    },
  });
};

export const logTabLoad = (
  client: UnifiedLogger,
  {
    loggingTarget,
    defaultTab,
    tabs,
  }: { loggingTarget?: LoggingTarget; defaultTab: string; tabs: Readonly<Array<string>> },
) => {
  const eventName = AnalyticsEventNames.PageTabLoad;
  client.logImpressionEvent({
    eventName,
    parameters: {
      value: defaultTab,
      tabs: tabs.join(','),
      ...loggingTargetToParameter(loggingTarget),
    },
  });
};

export const logFilterDrawerButtonClick = (
  client: UnifiedLogger,
  { loggingTarget }: { loggingTarget?: LoggingTarget },
) => {
  const eventName = AnalyticsEventNames.PageFilterDrawerButtonClick;
  client.logClickEvent({
    eventName,
    parameters: {
      ...loggingTargetToParameter(loggingTarget),
    },
  });
};

export const logFilterDrawerButtonImpression = (
  client: UnifiedLogger,
  { loggingTarget }: { loggingTarget?: LoggingTarget },
) => {
  const eventName = AnalyticsEventNames.PageFilterDrawerButtonImpression;
  client.logImpressionEvent({
    eventName,
    parameters: {
      ...loggingTargetToParameter(loggingTarget),
    },
  });
};

export const logPageTabView = (
  client: UnifiedLogger,
  { loggingTarget, tab }: { loggingTarget?: LoggingTarget; tab: string },
) => {
  const eventName = AnalyticsEventNames.PageTabView;
  client.logImpressionEvent({
    eventName,
    parameters: {
      value: tab,
      ...loggingTargetToParameter(loggingTarget),
    },
  });
};

export const logGranularityChange = (
  client: UnifiedLogger,
  {
    loggingTarget,
    newGranularity,
  }: {
    loggingTarget?: LoggingTarget;
    newGranularity: QueryParamGranularity;
  },
) => {
  const eventName = AnalyticsEventNames.PageGranularityChange;
  client.logClickEvent({
    eventName,
    parameters: {
      value: newGranularity,
      ...loggingTargetToParameter(loggingTarget),
    },
  });
};

export const logMonetizationDiscoveryCardClick = (
  client: UnifiedLogger,
  {
    loggingTarget,
    discoveryCardKey,
  }: {
    loggingTarget?: LoggingTarget;
    discoveryCardKey: string;
  },
) => {
  const eventName = AnalyticsEventNames.MonetizationDiscoveryCardClick;
  client.logClickEvent({
    eventName,
    parameters: {
      value: discoveryCardKey,
      ...loggingTargetToParameter(loggingTarget),
    },
  });
};

export const logAnalyticsHomeWatchlistImpression = (
  client: UnifiedLogger,
  {
    loggingTarget,
    experienceIds,
  }: { loggingTarget: AnalyticsHomeLoggingTarget; experienceIds: number[] },
) => {
  const eventName = AnalyticsEventNames.AnalyticsHomeWatchlistImpression;
  client.logImpressionEvent({
    eventName,
    parameters: {
      targetId: loggingTarget.targetId.toString(),
      targetType: loggingTarget.targetType,
      experienceIds: experienceIds.join(','),
    },
  });
};

export const logAnalyticsHomeExperiencesTableImpression = (
  client: UnifiedLogger,
  {
    loggingTarget,
    experienceIds,
  }: { loggingTarget: AnalyticsHomeLoggingTarget; experienceIds: number[] },
) => {
  const eventName = AnalyticsEventNames.AnalyticsHomeExperiencesTableImpression;
  client.logImpressionEvent({
    eventName,
    parameters: {
      targetId: loggingTarget.targetId.toString(),
      targetType: loggingTarget.targetType,
      experienceIds: experienceIds.join(','),
    },
  });
};

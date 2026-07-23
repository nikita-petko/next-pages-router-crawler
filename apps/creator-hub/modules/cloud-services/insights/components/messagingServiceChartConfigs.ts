import { translationKey } from '@modules/analytics-translations';
import { ChartType } from '@modules/charts-generic';
import { AnalyticsComponentType, ChartConfig } from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';

export const chartConfigMessagingServiceFanoutRatio = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.CsmFanoutRatio', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.CsmFanoutRatio',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.CsmFanoutRatio,
  overrides: {},
  chartType: ChartType.Spline,
  hideTotalSeriesInChart: false,
} as const satisfies ChartConfig;

export const chartConfigMessagingServiceGameServersConnectedCount = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.CsmGameServersConnected', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.CsmGameServersConnected',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.CsmGameServersConnectedCount,
  overrides: {},
  chartType: ChartType.Spline,
  hideTotalSeriesInChart: false,
} as const satisfies ChartConfig;

export const chartConfigMessagingServiceMessageSizeBytes = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.CsmMessageSize', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.CsmMessageSize',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.CsmMessageSizeBytes,
  overrides: {},
  chartType: ChartType.Spline,
  hideTotalSeriesInChart: false,
} as const satisfies ChartConfig;

export const chartConfigMessagingServicePublishedMessagesCount = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.CsmPublishedMessages', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.CsmPublishedMessages',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.CsmPublishedMessagesCount,
  overrides: {},
  chartType: ChartType.Spline,
  hideTotalSeriesInChart: false,
} as const satisfies ChartConfig;

export const chartConfigMessagingServiceReceivedMessagesCount = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.CsmReceivedMessages', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.CsmReceivedMessages',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.CsmReceivedMessagesCount,
  overrides: {},
  chartType: ChartType.Spline,
  hideTotalSeriesInChart: false,
} as const satisfies ChartConfig;

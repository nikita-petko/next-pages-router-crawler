import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import type { ChartConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

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

export const chartConfigMessagingServiceFanoutRatioExtended = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.CsmFanoutRatio', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.CsmFanoutRatio',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.CsmFanoutRatioExtended,
  overrides: {},
  chartType: ChartType.Spline,
  hideTotalSeriesInChart: false,
} as const satisfies ChartConfig;

export const chartConfigMessagingServicePublishedMessagesCountExtended = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.CsmPublishedMessages', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.CsmPublishedMessages',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.CsmPublishedMessagesExtendedCount,
  overrides: {},
  chartType: ChartType.Spline,
  hideTotalSeriesInChart: false,
} as const satisfies ChartConfig;

export const chartConfigMessagingServiceReceivedMessagesCountExtended = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.CsmReceivedMessages', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.CsmReceivedMessages',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.CsmReceivedMessagesExtendedCount,
  overrides: {},
  chartType: ChartType.Spline,
  hideTotalSeriesInChart: false,
} as const satisfies ChartConfig;

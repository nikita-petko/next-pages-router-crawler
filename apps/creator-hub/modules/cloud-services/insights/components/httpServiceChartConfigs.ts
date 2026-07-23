import { translationKey } from '@modules/analytics-translations';
import { ChartType } from '@modules/charts-generic';
import { AnalyticsComponentType, ChartConfig } from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RAQIV2Metric, RAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';

export const chartConfigHttpServiceRequestCount = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.HttpServiceRequests', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.HttpServiceRequests',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.HttpServiceRequestsCount,
  overrides: {},
  chartType: ChartType.Spline,
  hideTotalSeriesInChart: false,
} as const satisfies ChartConfig;

export const chartConfigHttpServiceResponseTime = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.HttpServiceResponseTime', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.HttpServiceResponseTime',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2UIMetric.HttpServiceResponseTime,
  overrides: {},
  chartType: ChartType.Spline,
  hideTotalSeriesInChart: false,
} as const satisfies ChartConfig;

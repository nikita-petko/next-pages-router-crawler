import { RAQIV2Metric, RAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import type { ChartConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export const chartConfigHttpServiceRequestCountExtended = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.HttpServiceRequests', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.HttpServiceRequests',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.HttpServiceRequestsExtendedCount,
  overrides: {},
  chartType: ChartType.Spline,
  hideTotalSeriesInChart: false,
} as const satisfies ChartConfig;

export const chartConfigHttpServiceResponseTimeExtended = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.HttpServiceResponseTime', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.HttpServiceResponseTime',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2UIMetric.HttpServiceResponseTimeExtended,
  overrides: {},
  chartType: ChartType.Spline,
  hideTotalSeriesInChart: false,
} as const satisfies ChartConfig;

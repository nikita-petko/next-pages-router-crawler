import { translationKey } from '@modules/analytics-translations';
import { ChartType } from '@modules/charts-generic';
import {
  RAQIV2SummaryType,
  AnalyticsComponentType,
  ChartConfig,
} from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';

export const chartConfigAffiliateLinkCreatorRewardsEarned = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey(
    'Label.Metric.AffiliateLinkDailyTotalPayoutRobux',
    TranslationNamespace.Analytics,
  ),
  definitionTooltipKey: translationKey(
    'Description.Metric.AffiliateLinkDailyTotalPayoutRobux',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.AffiliateLinkDailyTotalPayoutRobux,
  overrides: {},
  chartType: ChartType.Spline,
  overlays: [],
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }, { type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigClicks = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Label.Metric.AffiliateLinkDailyVisits', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.Metric.AffiliateLinkDailyVisits',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.AffiliateLinkDailyVisits,
  overrides: {},
  chartType: ChartType.Spline,
  overlays: [],
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }, { type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigUniqueClicks = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey(
    'Label.Metric.AffiliateLinkDailyUniqueClick',
    TranslationNamespace.Analytics,
  ),
  definitionTooltipKey: translationKey(
    'Description.Metric.AffiliateLinkDailyUniqueClick',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.AffiliateLinkDailyUniqueClick,
  overrides: {},
  chartType: ChartType.Spline,
  overlays: [],
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }, { type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigRewardedSignups = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey(
    'Label.Metric.AffiliateLinkDailyQualifiedSignups',
    TranslationNamespace.Analytics,
  ),
  definitionTooltipKey: translationKey(
    'Description.Metric.AffiliateLinkDailyQualifiedSignups',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.AffiliateLinkDailyQualifiedSignups,
  overrides: {},
  chartType: ChartType.Spline,
  overlays: [],
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }, { type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

// note: for star code only
export const chartConfigDailyRewardedActiveSpenders = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey(
    'Title.CreatorRewardsQualifiedSpenderPlays',
    TranslationNamespace.Analytics,
  ),
  definitionTooltipKey: translationKey(
    'Tooltip.DailyRewardedActiveSpendersAffiliateLinks',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.AffiliateLinkDailyQualifiedActiveSpenderReactivations,
  overrides: {},
  chartType: ChartType.Spline,
  overlays: [],
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }, { type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigRewardedReactivations = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey(
    'Label.Metric.AffiliateLinkDailyQualifiedReactivations',
    TranslationNamespace.Analytics,
  ),
  definitionTooltipKey: translationKey(
    'Description.Metric.AffiliateLinkDailyQualifiedReactivations',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.AffiliateLinkDailyQualifiedReactivations,
  overrides: {},
  chartType: ChartType.Spline,
  overlays: [],
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }, { type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

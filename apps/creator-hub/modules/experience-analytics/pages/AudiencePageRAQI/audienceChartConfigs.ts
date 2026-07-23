import { translationKey } from '@modules/analytics-translations';
import { ChartType } from '@modules/charts-generic';
import {
  AnalyticsComponentType,
  RAQIV2SummaryCardType,
  RAQIV2SummaryType,
  AnalyticsSummaryCardConfig,
  ChartConfig,
  RAQIV2PredefinedChartKey,
} from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RAQIV2Metric, RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';

export const summaryCardConfigMAUSummary = {
  type: AnalyticsComponentType.SummaryCard,
  summaryKey: 'MAUSummary',
  cardType: RAQIV2SummaryCardType.Metric,
  metric: RAQIV2Metric.MonthlyActiveUsers,
  summaryType: { type: RAQIV2SummaryType.Total },
  overrides: {},
  label: {
    key: translationKey(
      'Description.MonthlyActiveUsersDateSummary2',
      TranslationNamespace.Analytics,
    ),
    tooltip: translationKey('Description.MAU', TranslationNamespace.Analytics),
    type: 'dateAsStartDate',
  },
  fullWidth: true,
} as const satisfies AnalyticsSummaryCardConfig;

export const chartConfigAudienceCountry = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.AudienceCountry,
  metric: RAQIV2Metric.MonthlyActiveUsers,
  chartType: ChartType.Map,
  titleKey: translationKey('Title.Country', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.TopUsersByCountry',
    TranslationNamespace.Analytics,
  ),
  overrides: { breakdown: { override: [RAQIV2Dimension.Country] } },
  sort: {
    byBreakdownTotal: true,
  },
  breakdownLimit: 10,
  labelDataAsPercent: true,
  mapLegendSplits: [2, 4, 8, 16],
} as const satisfies ChartConfig;

export const chartConfigAudienceGender = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.AudienceGender,
  metric: RAQIV2Metric.MonthlyActiveUsers,
  chartType: ChartType.Bar,
  titleKey: translationKey('Title.Gender', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey('Description.TopGenders', TranslationNamespace.Analytics),
  overrides: { breakdown: { override: [RAQIV2Dimension.Gender] } },
  sort: {
    byBreakdownTotal: true,
  },
  labelDataAsPercent: true,
  chartHeight: 180,
} as const satisfies ChartConfig;

export const chartConfigAudienceAge = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.AudienceAge,
  metric: RAQIV2Metric.MonthlyActiveUsers,
  chartType: ChartType.Bar,
  titleKey: translationKey('Title.Age', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey('Description.TopAgeGroups', TranslationNamespace.Analytics),
  overrides: { breakdown: { override: [RAQIV2Dimension.AgeGroup] } },
  sort: {
    byBreakdownTotal: true,
  },
  labelDataAsPercent: true,
  chartHeight: 230,
} as const satisfies ChartConfig;

export const chartConfigAudienceLanguage = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.AudienceLanguage,
  metric: RAQIV2Metric.MonthlyActiveUsers,
  chartType: ChartType.Bar,
  titleKey: translationKey('Title.Language', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey('Description.TopLanguages', TranslationNamespace.Analytics),
  overrides: { breakdown: { override: [RAQIV2Dimension.Locale] } },
  sort: {
    byBreakdownTotal: true,
  },
  breakdownLimit: 10,
  labelDataAsPercent: true,
} as const satisfies ChartConfig;

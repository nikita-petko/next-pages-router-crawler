import {
  RAQIV2Metric,
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import type { ChartConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartConfig';
import { RAQIV2SummaryType } from '@modules/experience-analytics-shared/enums/RAQIV2SummaryType';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const BOUNTY_BAR_CHART_HEIGHT = 150;

export const chartConfigBountyPayoutsByUiEntryPoint = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.BountyPayoutsEarnedRobux', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.BountyPayoutsEarnedRobux',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.RobloxPlusDevBountyPayoutRobux,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.RobloxPlusDevBountySource],
    },
  },
  chartType: ChartType.Spline,
  overlays: [],
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }, { type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [{ type: RAQIV2SummaryType.Total }],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigDailySubscribersInExperience = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey(
    'Title.BountyPayoutsDailySubscribersInExperience',
    TranslationNamespace.Analytics,
  ),
  definitionTooltipKey: translationKey(
    'Description.BountyPayoutsDailySubscribersInExperience',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.RobloxPlusDevBountyDailySubscribers,
  overrides: {},
  chartType: ChartType.Spline,
  comparison: { chip: false },
  overlays: [],
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigSubscriberSpendInExperience = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey(
    'Title.BountyPayoutsSubscriberSpendInExperience',
    TranslationNamespace.Analytics,
  ),
  definitionTooltipKey: translationKey(
    'Description.BountyPayoutsSubscriberSpendInExperience',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.RobloxPlusDevBountySubscriberSpend,
  overrides: {},
  chartType: ChartType.Spline,
  comparison: { chip: false },
  overlays: [],
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }, { type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigAvgRobuxSpentPerSubscriber = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey(
    'Title.BountyPayoutsAvgRobuxSpentPerSubscriber',
    TranslationNamespace.Analytics,
  ),
  definitionTooltipKey: translationKey(
    'Description.BountyPayoutsAvgRobuxSpentPerSubscriber',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.RobloxPlusDevBountyAvgRobuxSpentPerSubscriber,
  overrides: {},
  chartType: ChartType.Spline,
  comparison: { chip: false },
  overlays: [],
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigPlusSubscribersBySource = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey(
    'Title.BountyPayoutsPlusSubscribersBySource',
    TranslationNamespace.Analytics,
  ),
  definitionTooltipKey: translationKey(
    'Description.BountyPayoutsPlusSubscribersBySource',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.RobloxPlusDevBountySubscriberCount,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.RobloxPlusDevBountySource],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
  chartType: ChartType.Bar,
  overlays: [],
  chartHeight: BOUNTY_BAR_CHART_HEIGHT,
  sort: {
    byBreakdownTotal: true,
  },
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }],
    perBreakdownSummaryTypes: [{ type: RAQIV2SummaryType.Total }],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigAvgPlaytimePerSubscriber = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey(
    'Title.BountyPayoutsAvgPlaytimePerSubscriber',
    TranslationNamespace.Analytics,
  ),
  definitionTooltipKey: translationKey(
    'Description.BountyPayoutsAvgPlaytimePerSubscriber',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.RobloxPlusDevBountyAvgPlaytimePerSubscriberMins,
  overrides: {},
  chartType: ChartType.Spline,
  comparison: { chip: false },
  overlays: [],
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

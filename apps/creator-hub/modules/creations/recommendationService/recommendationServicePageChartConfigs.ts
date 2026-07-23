import { translationKey } from '@modules/analytics-translations';
import { ChartType } from '@modules/charts-generic';
import {
  RAQIV2SummaryType,
  AnalyticsComponentType,
  ChartConfig,
} from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RAQIV2Dimension, RAQIV2Metric } from '@rbx/creator-hub-analytics-config';

export const chartConfigAverageViewTimePerUser = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey(
    'Label.Metric.AvgViewTimePerViewer',
    TranslationNamespace.RecommendationService,
  ),
  definitionTooltipKey: translationKey(
    'Description.AvgViewTimePerViewer',
    TranslationNamespace.RecommendationService,
  ),
  metric: RAQIV2Metric.AvgViewTimePerViewer,
  overrides: {},
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigNumItemsImpressedPerUser = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey(
    'Label.Metric.NumItemsImpressedPerUser',
    TranslationNamespace.RecommendationService,
  ),
  definitionTooltipKey: translationKey(
    'Description.UniqueItemsPerUser',
    TranslationNamespace.RecommendationService,
  ),
  metric: RAQIV2Metric.AverageImpressionsPerUser,
  overrides: {},
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigTotalActionsByActionType = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Label.Card.TotalActions', TranslationNamespace.RecommendationService),
  definitionTooltipKey: translationKey(
    'Description.TotalActions',
    TranslationNamespace.RecommendationService,
  ),
  metric: RAQIV2Metric.TotalActionsByActionType,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.ActionType],
    },
  },
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

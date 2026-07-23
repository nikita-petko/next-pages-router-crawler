import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import type { RAQIV2SummarySpec } from '@modules/experience-analytics-shared/adapters/genericRAQIV2ChartSummaryAdapter';
import { RAQIV2SummaryType } from '@modules/experience-analytics-shared/enums/RAQIV2SummaryType';
import type { TabbedChartConfig } from '@modules/experience-analytics-shared/types/RAQIV2TabbedChartConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const summarySpec: RAQIV2SummarySpec = {
  totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }, { type: RAQIV2SummaryType.Average }],
  perBreakdownSummaryTypes: [],
  aggregatedBreakdownSummaryTypes: [],
};

export const tabbedChartConfigIphEarnings = {
  type: AnalyticsComponentType.TabbedChart,
  titleKey: translationKey('Label.Metric.IphEarningsRobux', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.IphEarningsRobux',
    TranslationNamespace.Analytics,
  ),
  tabs: [
    {
      tabLabel: translationKey('Label.Metric.IphEarningsRobux', TranslationNamespace.Analytics),
      chart: {
        type: AnalyticsComponentType.Chart,
        titleKey: translationKey('Label.Metric.IphEarningsRobux', TranslationNamespace.Analytics),
        metric: RAQIV2Metric.IphEarningsRobux,
        overrides: {},
        chartType: ChartType.Spline,
        summarySpec,
      },
    },
    {
      tabLabel: translationKey('Label.Metric.IphTransactionCount', TranslationNamespace.Analytics),
      chart: {
        type: AnalyticsComponentType.Chart,
        titleKey: translationKey(
          'Label.Metric.IphTransactionCount',
          TranslationNamespace.Analytics,
        ),
        metric: RAQIV2Metric.IphTransactionCount,
        overrides: {},
        chartType: ChartType.Spline,
        summarySpec,
      },
    },
  ],
} as const satisfies TabbedChartConfig;

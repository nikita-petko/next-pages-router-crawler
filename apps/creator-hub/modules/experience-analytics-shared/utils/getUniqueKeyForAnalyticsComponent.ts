import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { brandString } from '@modules/charts-generic/types/Branded';
import { getUniqueKeyForChartConfig } from '../constants/RAQIV2PredefinedChartConfig';
import { getUniqueKeyForTabbedChartConfig } from '../constants/RAQIV2PredefinedTabbedChartConfig';
import type { AnalyticsComponentConfig } from '../types/RAQIV2PageConfig';
import getStableKey from './getStableKey';
import type { UniqueKeyForAnalyticsComponent } from './getUniqueKeyForKeyOrConfig';

/**
 * Frequently we need to use a unique key per-chart, when rendering react,
 * identifying the chart as part of a selector, etc. This function will
 * return a stable key for a given chart config object --
 * or its RAQIV2PredefinedChartKey if it has one.
 */
const getUniqueKeyForAnalyticsComponent = (
  chartKeyOrConfig: AnalyticsComponentConfig,
): UniqueKeyForAnalyticsComponent => {
  if (typeof chartKeyOrConfig === 'string') {
    return brandString<UniqueKeyForAnalyticsComponent>(chartKeyOrConfig);
  }

  switch (chartKeyOrConfig.type) {
    case AnalyticsComponentType.TabbedChart:
      return getUniqueKeyForTabbedChartConfig(chartKeyOrConfig);
    case AnalyticsComponentType.Chart:
      return getUniqueKeyForChartConfig(chartKeyOrConfig);
    case AnalyticsComponentType.Table:
      return brandString<UniqueKeyForAnalyticsComponent>(
        chartKeyOrConfig.tableKey ?? getStableKey(chartKeyOrConfig),
      );
    case AnalyticsComponentType.TabbedTable:
    case AnalyticsComponentType.SummaryCard:
    case AnalyticsComponentType.NonGeneric:
    case AnalyticsComponentType.ControlledSubcontext:
      return brandString<UniqueKeyForAnalyticsComponent>(getStableKey(chartKeyOrConfig));
    default:
      return brandString<UniqueKeyForAnalyticsComponent>(getStableKey(chartKeyOrConfig));
  }
};

export default getUniqueKeyForAnalyticsComponent;

import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
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
    return chartKeyOrConfig as UniqueKeyForAnalyticsComponent;
  }

  switch (chartKeyOrConfig.type) {
    case AnalyticsComponentType.TabbedChart:
      return getUniqueKeyForTabbedChartConfig(chartKeyOrConfig);
    case AnalyticsComponentType.Chart:
      return getUniqueKeyForChartConfig(chartKeyOrConfig);
    default:
      return getStableKey(chartKeyOrConfig) as UniqueKeyForAnalyticsComponent;
  }
};

export default getUniqueKeyForAnalyticsComponent;

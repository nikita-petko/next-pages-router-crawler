import { RAQIV2MetricDisplayConfig } from '@rbx/creator-hub-analytics-config';
import type { TranslationKey } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { TChartConfiguratorMetrics } from './chartConfiguratorMetricsConfig';

/**
 * Derives the chart configurator metric group from codegen config
 * (RAQIV2MetricDisplayConfig[metric].exploreMode.group) rather than
 * maintaining a hardcoded mapping in the frontend.
 */
export const codegenChartConfiguratorMetricToGroup = (
  metric: TChartConfiguratorMetrics,
): TranslationKey => {
  const config = RAQIV2MetricDisplayConfig[metric];
  if (config.exploreMode && !config.exploreMode.disabled && config.exploreMode.group) {
    const { key, namespace } = config.exploreMode.group;
    return { key, namespace };
  }
  return translationKey('Label.None', TranslationNamespace.Analytics);
};
export default codegenChartConfiguratorMetricToGroup;

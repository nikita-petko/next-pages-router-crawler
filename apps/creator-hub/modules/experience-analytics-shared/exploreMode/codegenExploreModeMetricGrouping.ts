import { TranslationKey, translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RAQIV2MetricDisplayConfig } from '@rbx/creator-hub-analytics-config';
import type { TExploreModeMetrics } from './exploreModeMetricsConfig';

/**
 * Derives the explore mode metric group from the codegen config
 * (RAQIV2MetricDisplayConfig[metric].exploreMode.group) rather than
 * maintaining a hardcoded mapping in the frontend.
 */
export const codegenExploreModeMetricToGroup = (metric: TExploreModeMetrics): TranslationKey => {
  const config = RAQIV2MetricDisplayConfig[metric];
  if (config.exploreMode && !config.exploreMode.disabled && config.exploreMode.group) {
    const { key, namespace } = config.exploreMode.group;
    return { key, namespace };
  }
  return translationKey('Label.None', TranslationNamespace.Analytics);
};
export default codegenExploreModeMetricToGroup;

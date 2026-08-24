import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import type { ComputedMetric } from '../../../types/ComputedMetric';
import type { AnalyticsComponentConfig } from '../../../types/RAQIV2PageConfig';
import getStableKey from '../../../utils/getStableKey';
import getUniqueKeyForAnalyticsComponent from '../../../utils/getUniqueKeyForAnalyticsComponent';

/**
 * Fingerprint the query-relevant computed-metric payload so renaming a formula
 * does not remount the chart, but formula/source edits do.
 */
const getComputedMetricQueryFingerprint = (computedMetric: ComputedMetric): string =>
  getStableKey({
    sources: computedMetric.sources,
    formula: computedMetric.formula,
    l7Smoothing: computedMetric.l7Smoothing ?? false,
  });

const getReactKey =
  /**
   * NOTE(gperkins@20240617): This key determines when we reuse chart components.
   * We first off don't want to transition the same component between different metric/charts.
   *
   * But we also want to be sure that if the time-related props change,
   * we don't reuse the component. Otherwise it can feel like the interface is stuck
   * when we fetch more data points without a loading indicator.
   * See https://roblox.atlassian.net/browse/DSA-1786 more background on that issue.
   *
   * Custom-dashboard tiles reuse `chartKey` as the tile id for drag/resize.
   * Computed-metric edits keep that identity for DnD, but the React key must
   * still change when the formula payload changes so the configurable chart
   * remounts and refetches instead of showing the previous series.
   */
  (config: AnalyticsComponentConfig) => {
    const uniqueKey = getUniqueKeyForAnalyticsComponent(config);
    if (
      typeof config === 'object' &&
      config.type === AnalyticsComponentType.Chart &&
      config.computedMetric
    ) {
      return `${uniqueKey}:${getComputedMetricQueryFingerprint(config.computedMetric)}`;
    }
    return uniqueKey;
  };
export default getReactKey;

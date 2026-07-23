import { AnalyticsComponentConfig } from '../../../types/RAQIV2PageConfig';
import getUniqueKeyForAnalyticsComponent from '../../../utils/getUniqueKeyForAnalyticsComponent';

const getReactKey =
  /**
   * NOTE(gperkins@20240617): This key determines when we reuse chart components.
   * We first off don't want to transition the same component between different metric/charts.
   *
   * But we also want to be sure that if the time-related props change,
   * we don't reuse the component. Otherwise it can feel like the interface is stuck
   * when we fetch more data points without a loading indicator.
   * See https://roblox.atlassian.net/browse/DSA-1786 more background on that issue.
   */
  (config: AnalyticsComponentConfig) => {
    return getUniqueKeyForAnalyticsComponent(config);
  };
export default getReactKey;

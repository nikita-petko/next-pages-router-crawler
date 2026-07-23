import type AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import getStableKey from './getStableKey';

export type UniqueKeyForAnalyticsComponent = string & { UniqueKeyForAnalyticsComponent: never };

/** Structural shape used by chart and tabbed chart config resolvers — avoids importing RAQIV2PageConfig here. */
export type AnalyticsComponentConfigLiteralForUniqueKey = {
  type: AnalyticsComponentType;
  chartKey?: string;
};

export const getUniqueKeyForKeyOrConfig = <T>(
  chartKeyOrConfig: T,
  getConfigFromKeyOrConfig: (keyOrConfig: T) => AnalyticsComponentConfigLiteralForUniqueKey,
): UniqueKeyForAnalyticsComponent => {
  const config = getConfigFromKeyOrConfig(chartKeyOrConfig);
  const { chartKey, ...rest } = config;
  if (chartKey) {
    return chartKey as UniqueKeyForAnalyticsComponent;
  }
  return getStableKey(rest) as UniqueKeyForAnalyticsComponent;
};

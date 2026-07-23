import type { NonEmptyArray } from '@modules/charts-generic/types/NonEmptyArray';
import { flatMapNonEmptyArray } from '@modules/charts-generic/types/NonEmptyArray';
import type { TabbedChartConfig } from '../types/RAQIV2TabbedChartConfig';
import {
  getUniqueKeyForKeyOrConfig,
  type UniqueKeyForAnalyticsComponent,
} from '../utils/getUniqueKeyForKeyOrConfig';
import type { TRAQIV2NumericUIMetric } from './AnalyticsMetricDisplayConfig';
import {
  tabbedChartConfigTopSourcesAndSinksMigration,
  tabbedChartConfigImpressionsPerSource,
  tabbedChartConfigImpressionsPerSourceMigration,
  tabbedChartConfigPlaysPerSource,
  tabbedChartConfigPlaysPerSourceMigration,
  tabbedChartConfigDailyActiveUsers,
  tabbedChartConfigEngagementSessionTime,
  tabbedChartConfigExperienceAnalyticsSummaryV3,
} from './chart-configs/PredefinedTabbedChartConfigLiterals';
import { getMetricsFromPredefinedChart } from './RAQIV2PredefinedChartConfig';
import RAQIV2PredefinedTabbedChartKey from './RAQIV2PredefinedTabbedChartKey';

/** Chart keys excluded here are defined in their respective modules */
type TRAQIV2PredefinedTabbedChartKey = Exclude<
  RAQIV2PredefinedTabbedChartKey,
  | RAQIV2PredefinedTabbedChartKey.ItemRevenueAndSales
  | RAQIV2PredefinedTabbedChartKey.StoreAssetMonetization
>;

export type TabbedChartConfigOrPredefinedKey = TabbedChartConfig | TRAQIV2PredefinedTabbedChartKey;

const RAQIV2PredefinedTabbedChartConfig: Record<
  TRAQIV2PredefinedTabbedChartKey,
  TabbedChartConfig
> = {
  [RAQIV2PredefinedTabbedChartKey.TopSourcesAndSinksMigration]:
    tabbedChartConfigTopSourcesAndSinksMigration,
  [RAQIV2PredefinedTabbedChartKey.ImpressionsPerSource]: tabbedChartConfigImpressionsPerSource,
  [RAQIV2PredefinedTabbedChartKey.ImpressionsPerSourceMigration]:
    tabbedChartConfigImpressionsPerSourceMigration,
  [RAQIV2PredefinedTabbedChartKey.PlaysPerSource]: tabbedChartConfigPlaysPerSource,
  [RAQIV2PredefinedTabbedChartKey.PlaysPerSourceMigration]:
    tabbedChartConfigPlaysPerSourceMigration,
  [RAQIV2PredefinedTabbedChartKey.DailyActiveUsers]: tabbedChartConfigDailyActiveUsers,
  [RAQIV2PredefinedTabbedChartKey.EngagementSessionTime]: tabbedChartConfigEngagementSessionTime,
  [RAQIV2PredefinedTabbedChartKey.ExperienceAnalyticsSummaryV3]:
    tabbedChartConfigExperienceAnalyticsSummaryV3,
};

export default RAQIV2PredefinedTabbedChartConfig;

export const getTabbedConfigFromKeyOrConfig = (
  chartKeyOrConfig: TabbedChartConfigOrPredefinedKey,
): TabbedChartConfig => {
  return typeof chartKeyOrConfig === 'string'
    ? RAQIV2PredefinedTabbedChartConfig[chartKeyOrConfig]
    : chartKeyOrConfig;
};

export const getMetricsFromPredefinedTabbedChart = (
  chartKeyOrConfig: TabbedChartConfigOrPredefinedKey,
): NonEmptyArray<TRAQIV2NumericUIMetric> => {
  const config = getTabbedConfigFromKeyOrConfig(chartKeyOrConfig);
  return flatMapNonEmptyArray(config.tabs, (tab) => getMetricsFromPredefinedChart(tab.chart));
};

export const getUniqueKeyForTabbedChartConfig = (
  chartKeyOrConfig: TabbedChartConfigOrPredefinedKey,
): UniqueKeyForAnalyticsComponent => {
  return getUniqueKeyForKeyOrConfig(chartKeyOrConfig, getTabbedConfigFromKeyOrConfig);
};

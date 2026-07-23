import {
  flatMapNonEmptyArray,
  NonEmptyArray,
  type AnalyticsNavigationItem,
} from '@modules/charts-generic';
import { TranslationKey } from '@modules/analytics-translations';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import RAQIV2PredefinedTabbedChartKey from './RAQIV2PredefinedTabbedChartKey';
import {
  ChartConfigOrPredefinedKey,
  getMetricsFromPredefinedChart,
} from './RAQIV2PredefinedChartConfig';
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
import {
  getUniqueKeyForKeyOrConfig,
  UniqueKeyForAnalyticsComponent,
} from '../utils/getUniqueKeyForAnalyticsComponent';
import { type TRAQIV2NumericUIMetric } from './AnalyticsMetricDisplayConfig';
import { OnboardingTipsConfigs } from './onboardingTipsConfigs';

type Action = {
  actionLabel: TranslationKey;
  actionTargetNavigationItem: AnalyticsNavigationItem;
  actionEventName: string | null;
};

export type TabbedChartConfig = {
  type: AnalyticsComponentType.TabbedChart;
  chartKey?: string; // previously RAQIV2PredefinedTabbedChartKey, only used for logging
  titleKey: TranslationKey;
  definitionTooltipKey?: TranslationKey;
  onboardingTipsConfig?: OnboardingTipsConfigs;
  tabs: NonEmptyArray<{
    chart: ChartConfigOrPredefinedKey;
    tabLabel: TranslationKey;
    action?: Action;
  }>;
};

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

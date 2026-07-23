import { translationKey, TranslationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import RAQIV2PredefinedChartKey from '../constants/RAQIV2PredefinedChartKey';

export const AchievementChartKeys = {
  [RAQIV2PredefinedChartKey.D1Retention]: RAQIV2PredefinedChartKey.D1Retention,
  [RAQIV2PredefinedChartKey.D7Retention]: RAQIV2PredefinedChartKey.D7Retention,
  [RAQIV2PredefinedChartKey.D30Retention]: RAQIV2PredefinedChartKey.D30Retention,
  [RAQIV2PredefinedChartKey.DailyActiveUsers]: RAQIV2PredefinedChartKey.DailyActiveUsers,
  [RAQIV2PredefinedChartKey.EngagementAverageSessionTime]:
    RAQIV2PredefinedChartKey.EngagementAverageSessionTime,
  [RAQIV2PredefinedChartKey.DailyRevenue]: RAQIV2PredefinedChartKey.DailyRevenue,
  [RAQIV2PredefinedChartKey.ConversionRate]: RAQIV2PredefinedChartKey.ConversionRate,
  [RAQIV2PredefinedChartKey.AverageRevenuePerPayingUser]:
    RAQIV2PredefinedChartKey.AverageRevenuePerPayingUser,
  [RAQIV2PredefinedChartKey.EngagementNewUsers]: RAQIV2PredefinedChartKey.EngagementNewUsers,
  [RAQIV2PredefinedChartKey.PerformanceConcurrentPlayers]:
    RAQIV2PredefinedChartKey.PerformanceConcurrentPlayers,
} as const;
export type AchievementChartKeys = (typeof AchievementChartKeys)[keyof typeof AchievementChartKeys];

export const RAQIV2PredefinedChartKeysToInsightTranslationKeys: Record<
  AchievementChartKeys,
  {
    header: TranslationKey;
    headerV2: TranslationKey;
    description: TranslationKey;
    action: TranslationKey;
  }
> = {
  [RAQIV2PredefinedChartKey.D1Retention]: {
    header: translationKey('Header.D1RetentionSixMonthHigh', TranslationNamespace.Insights),
    headerV2: translationKey('Header.D1RetentionSixMonthHighV2', TranslationNamespace.Insights),
    description: translationKey(
      'Description.D1RetentionSixMonthHigh',
      TranslationNamespace.Insights,
    ),
    action: translationKey('Action.ViewD1Retention', TranslationNamespace.Insights),
  },
  [RAQIV2PredefinedChartKey.D7Retention]: {
    header: translationKey('Header.D7RetentionSixMonthHigh', TranslationNamespace.Insights),
    headerV2: translationKey('Header.D7RetentionSixMonthHighV2', TranslationNamespace.Insights),
    description: translationKey(
      'Description.D7RetentionSixMonthHigh',
      TranslationNamespace.Insights,
    ),
    action: translationKey('Action.ViewD7Retention', TranslationNamespace.Insights),
  },
  [RAQIV2PredefinedChartKey.D30Retention]: {
    header: translationKey('Header.D30RetentionSixMonthHigh', TranslationNamespace.Insights),
    headerV2: translationKey('Header.D30RetentionSixMonthHighV2', TranslationNamespace.Insights),
    description: translationKey(
      'Description.D30RetentionSixMonthHigh',
      TranslationNamespace.Insights,
    ),
    action: translationKey('Action.ViewD30Retention', TranslationNamespace.Insights),
  },
  [RAQIV2PredefinedChartKey.DailyActiveUsers]: {
    header: translationKey('Header.DauSixMonthHigh', TranslationNamespace.Insights),
    headerV2: translationKey('Header.DauSixMonthHighV2', TranslationNamespace.Insights),
    description: translationKey('Description.DauSixMonthHigh', TranslationNamespace.Insights),
    action: translationKey('Action.ViewDau', TranslationNamespace.Insights),
  },
  [RAQIV2PredefinedChartKey.EngagementAverageSessionTime]: {
    header: translationKey('Header.AvgPlayTimeSixMonthHigh', TranslationNamespace.Insights),
    headerV2: translationKey('Header.AvgPlayTimeSixMonthHighV2', TranslationNamespace.Insights),
    description: translationKey(
      'Description.AvgPlayTimeSixMonthHigh',
      TranslationNamespace.Insights,
    ),
    action: translationKey('Action.AvgPlayTime', TranslationNamespace.Insights),
  },
  [RAQIV2PredefinedChartKey.DailyRevenue]: {
    header: translationKey('Header.RobuxSpentSixMonthHigh', TranslationNamespace.Insights),
    headerV2: translationKey('Header.RobuxSpentSixMonthHighV2', TranslationNamespace.Insights),
    description: translationKey(
      'Description.RobuxSpentSixMonthHigh',
      TranslationNamespace.Insights,
    ),
    action: translationKey('Action.ViewRevenue', TranslationNamespace.Insights),
  },
  [RAQIV2PredefinedChartKey.ConversionRate]: {
    header: translationKey('Header.ConversionRateSixMonthHigh', TranslationNamespace.Insights),
    headerV2: translationKey('Header.ConversionRateSixMonthHighV2', TranslationNamespace.Insights),
    description: translationKey(
      'Description.ConversionRateSixMonthHigh',
      TranslationNamespace.Insights,
    ),
    action: translationKey('Action.ViewPayerConversion', TranslationNamespace.Insights),
  },
  [RAQIV2PredefinedChartKey.AverageRevenuePerPayingUser]: {
    header: translationKey('Header.ArppuSixMonthHigh', TranslationNamespace.Insights),
    headerV2: translationKey('Header.ArppuSixMonthHighV2', TranslationNamespace.Insights),
    description: translationKey('Description.ArppuSixMonthHigh', TranslationNamespace.Insights),
    action: translationKey('Action.ViewArppu', TranslationNamespace.Insights),
  },
  [RAQIV2PredefinedChartKey.EngagementNewUsers]: {
    header: translationKey('Header.NewUsersSixMonthHigh', TranslationNamespace.Insights),
    headerV2: translationKey('Header.NewUsersSixMonthHighV2', TranslationNamespace.Insights),
    description: translationKey('Description.NewUsersSixMonthHigh', TranslationNamespace.Insights),
    action: translationKey('Action.ViewNewUsers', TranslationNamespace.Insights),
  },
  [RAQIV2PredefinedChartKey.PerformanceConcurrentPlayers]: {
    header: translationKey('Header.ConcurrentPlayersSixMonthHigh', TranslationNamespace.Insights),
    headerV2: translationKey(
      'Header.ConcurrentPlayersSixMonthHighV2',
      TranslationNamespace.Insights,
    ),
    description: translationKey(
      'Description.ConcurrentPlayersSixMonthHigh',
      TranslationNamespace.Insights,
    ),
    action: translationKey('Action.ViewEngagement', TranslationNamespace.Insights),
  },
};

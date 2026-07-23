import { TranslationKey, translationKey } from '@modules/analytics-translations';
import { RAQIV2Dimension, RAQIV2IsNewUser, RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import { SpecOverride, TRAQIV2NumericUIMetric } from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export enum WatchlistExperienceTileMetricKeys {
  dau = 'dau',
  newUsers = 'newUsers',
  averagePlaytimePerDau = 'averagePlaytimePerDau',
  d1Retention = 'd1Retention',
  dailyRevenue = 'dailyRevenue',
}

export const WatchlistExperienceTileMetricsOrder = [
  WatchlistExperienceTileMetricKeys.dau,
  WatchlistExperienceTileMetricKeys.newUsers,
  WatchlistExperienceTileMetricKeys.averagePlaytimePerDau,
  WatchlistExperienceTileMetricKeys.d1Retention,
  WatchlistExperienceTileMetricKeys.dailyRevenue,
];

export const WatchlistExperienceTileMetricTranslationKeys: Record<
  WatchlistExperienceTileMetricKeys,
  TranslationKey
> = {
  [WatchlistExperienceTileMetricKeys.dau]: translationKey(
    'Title.DAU',
    TranslationNamespace.Analytics,
  ),
  [WatchlistExperienceTileMetricKeys.newUsers]: translationKey(
    'Title.NewUsers',
    TranslationNamespace.Analytics,
  ),
  [WatchlistExperienceTileMetricKeys.averagePlaytimePerDau]: translationKey(
    'Title.AveragePlayTimePerDAU',
    TranslationNamespace.Analytics,
  ),
  [WatchlistExperienceTileMetricKeys.d1Retention]: translationKey(
    'Title.D1Retention',
    TranslationNamespace.Analytics,
  ),
  [WatchlistExperienceTileMetricKeys.dailyRevenue]: translationKey(
    'Title.Robux',
    TranslationNamespace.Analytics,
  ),
};

type MetricConfig = {
  metric: TRAQIV2NumericUIMetric;
  overrides?: SpecOverride;
};

export const WatchlistExperienceTileMetricKeyConfig: Record<
  WatchlistExperienceTileMetricKeys,
  MetricConfig
> = {
  [WatchlistExperienceTileMetricKeys.dau]: {
    metric: RAQIV2Metric.DailyActiveUsers,
  },
  [WatchlistExperienceTileMetricKeys.newUsers]: {
    metric: RAQIV2Metric.UniqueUsersWithPlaySessionsMigration,
    overrides: {
      filter: {
        override: [
          {
            dimension: RAQIV2Dimension.IsNewUser,
            values: [RAQIV2IsNewUser.New],
          },
        ],
      },
    },
  },
  [WatchlistExperienceTileMetricKeys.averagePlaytimePerDau]: {
    metric: RAQIV2Metric.AveragePlayTimeMinutesPerDAU,
  },
  [WatchlistExperienceTileMetricKeys.d1Retention]: {
    metric: RAQIV2Metric.D1Retention,
  },
  [WatchlistExperienceTileMetricKeys.dailyRevenue]: {
    metric: RAQIV2Metric.DailyRevenue,
  },
};

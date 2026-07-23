import { RAQIV2Dimension, RAQIV2IsNewUser, RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import type { TranslationKey } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import {
  ChartUnit,
  ChartUnitAggregationType,
} from '@modules/charts-generic/charts/types/ChartTypes';
import type { TRAQIV2NumericUIMetric } from '@modules/experience-analytics-shared/constants/AnalyticsMetricDisplayConfig';
import type { SpecOverride } from '@modules/experience-analytics-shared/utils/computeRAQIV2SpecOverride';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export enum ExperiencesTableMetricKeys {
  dau = 'dau',
  newUsers = 'newUsers',
  averageSessionTime = 'averageSessionTime',
  d1Retention = 'd1Retention',
  dailyRevenue = 'dailyRevenue',
}

export const ExperiencesTableMetricColumnsOrder = [
  ExperiencesTableMetricKeys.dau,
  ExperiencesTableMetricKeys.newUsers,
  ExperiencesTableMetricKeys.averageSessionTime,
  ExperiencesTableMetricKeys.d1Retention,
  ExperiencesTableMetricKeys.dailyRevenue,
];

export const ExperiencesTableMetricsTranslationKeys: Record<
  ExperiencesTableMetricKeys,
  TranslationKey
> = {
  [ExperiencesTableMetricKeys.dau]: translationKey('Title.DAU', TranslationNamespace.Analytics),
  [ExperiencesTableMetricKeys.newUsers]: translationKey(
    'Title.NewUsers',
    TranslationNamespace.Analytics,
  ),
  [ExperiencesTableMetricKeys.averageSessionTime]: translationKey(
    'Title.AveragePlayTime',
    TranslationNamespace.Analytics,
  ),
  [ExperiencesTableMetricKeys.d1Retention]: translationKey(
    'Title.D1Retention',
    TranslationNamespace.Analytics,
  ),
  [ExperiencesTableMetricKeys.dailyRevenue]: translationKey(
    'Title.Robux',
    TranslationNamespace.Analytics,
  ),
};

export const ExperiencesTableMetricToChartUnit: Record<ExperiencesTableMetricKeys, ChartUnit> = {
  [ExperiencesTableMetricKeys.averageSessionTime]: ChartUnit.Minutes,
  [ExperiencesTableMetricKeys.d1Retention]: ChartUnit.LegacyPercentage,
  [ExperiencesTableMetricKeys.dailyRevenue]: ChartUnit.Robux,
  [ExperiencesTableMetricKeys.dau]: ChartUnit.Players,
  [ExperiencesTableMetricKeys.newUsers]: ChartUnit.Players,
};

export const ExperiencesTableMetricToChartUnitAggregationType: Record<
  ExperiencesTableMetricKeys,
  ChartUnitAggregationType
> = {
  [ExperiencesTableMetricKeys.averageSessionTime]: ChartUnitAggregationType.Average,
  [ExperiencesTableMetricKeys.d1Retention]: ChartUnitAggregationType.Ratio,
  [ExperiencesTableMetricKeys.dailyRevenue]: ChartUnitAggregationType.Sum,
  [ExperiencesTableMetricKeys.dau]: ChartUnitAggregationType.Sum,
  [ExperiencesTableMetricKeys.newUsers]: ChartUnitAggregationType.Sum,
};

type ColumnConfig = {
  metric: TRAQIV2NumericUIMetric;
  overrides?: SpecOverride;
};

export const ExperiencesTableMetricKeyConfig: Record<ExperiencesTableMetricKeys, ColumnConfig> = {
  [ExperiencesTableMetricKeys.dau]: {
    metric: RAQIV2Metric.DailyActiveUsers,
  },
  [ExperiencesTableMetricKeys.newUsers]: {
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
  [ExperiencesTableMetricKeys.averageSessionTime]: {
    metric: RAQIV2Metric.AverageSessionLengthMinutes,
  },
  [ExperiencesTableMetricKeys.d1Retention]: {
    metric: RAQIV2Metric.D1Retention,
  },
  [ExperiencesTableMetricKeys.dailyRevenue]: {
    metric: RAQIV2Metric.DailyRevenue,
  },
};

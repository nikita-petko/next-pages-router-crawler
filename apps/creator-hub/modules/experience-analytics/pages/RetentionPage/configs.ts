import { ColumnType, TableColumnConfig } from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';

export enum SpecialCohortColumnKey {
  Cohort = 'Cohort',
  CohortInterval = 'CohortInterval',
}

const orderedSharedColumnKeys = [
  SpecialCohortColumnKey.Cohort,
  RAQIV2Metric.UniqueUsersWithPlaySessions,
] as const;

export const orderedDownFunnelColumnKeys = [
  ...orderedSharedColumnKeys,
  RAQIV2Metric.AttributionD1RetentionRatio,
  RAQIV2Metric.Attribution7DPlaytimePerUserInMinutes,
  RAQIV2Metric.Attribution7DPayerConversionRatio,
  RAQIV2Metric.Attribution7DRobuxPerUser,
  RAQIV2Metric.Attribution30DRobuxPerUser,
] as const;
export type DownFunnelColumnKey = (typeof orderedDownFunnelColumnKeys)[number];

export const orderedRetentionColumnKeys = [
  ...orderedSharedColumnKeys,
  SpecialCohortColumnKey.CohortInterval,
] as const;
export type RetentionColumnKey = (typeof orderedRetentionColumnKeys)[number];

// Column configs for cohort tables
const SharedCohortTableColumnConfig = {
  [SpecialCohortColumnKey.Cohort]: {
    titleKey: translationKey('Title.Table.Cohort', TranslationNamespace.Analytics),
    tooltipKey: translationKey('Tooltip.Table.Cohort', TranslationNamespace.Analytics),
    columnKey: SpecialCohortColumnKey.Cohort,
    columnType: ColumnType.Text,
    widthWeight: 10,
  },
  [RAQIV2Metric.UniqueUsersWithPlaySessions]: {
    titleKey: translationKey('Title.Table.RetentionUsersWithPlays', TranslationNamespace.Analytics),
    columnKey: RAQIV2Metric.UniqueUsersWithPlaySessions,
    columnType: ColumnType.Number,
  },
} as const;

export const DownFunnelTableColumnConfig: Record<
  DownFunnelColumnKey,
  TableColumnConfig<DownFunnelColumnKey>
> = {
  ...SharedCohortTableColumnConfig,
  [RAQIV2Metric.AttributionD1RetentionRatio]: {
    titleKey: translationKey('Title.Table.D1Retention', TranslationNamespace.Analytics),
    columnKey: RAQIV2Metric.AttributionD1RetentionRatio,
    columnType: ColumnType.Number,
  },
  [RAQIV2Metric.Attribution7DPlaytimePerUserInMinutes]: {
    titleKey: translationKey(
      'Title.Table.Retention7DPlaytimePerUser',
      TranslationNamespace.Analytics,
    ),
    columnKey: RAQIV2Metric.Attribution7DPlaytimePerUserInMinutes,
    columnType: ColumnType.Number,
  },
  [RAQIV2Metric.Attribution7DPayerConversionRatio]: {
    titleKey: translationKey(
      'Title.Table.Retention7DPayerConversion',
      TranslationNamespace.Analytics,
    ),
    columnKey: RAQIV2Metric.Attribution7DPayerConversionRatio,
    columnType: ColumnType.Number,
  },
  [RAQIV2Metric.Attribution7DRobuxPerUser]: {
    titleKey: translationKey(
      'Title.Table.Retention7DRevenuePerUser',
      TranslationNamespace.Analytics,
    ),
    columnKey: RAQIV2Metric.Attribution7DRobuxPerUser,
    columnType: ColumnType.Number,
  },
  [RAQIV2Metric.Attribution30DRobuxPerUser]: {
    titleKey: translationKey(
      'Title.Table.Retention30DRevenuePerUser',
      TranslationNamespace.Analytics,
    ),
    columnKey: RAQIV2Metric.Attribution30DRobuxPerUser,
    columnType: ColumnType.Number,
  },
};

export const CohortRetentionTableColumnConfig: Record<
  RetentionColumnKey,
  TableColumnConfig<RetentionColumnKey>
> = {
  ...SharedCohortTableColumnConfig,
  [SpecialCohortColumnKey.CohortInterval]: {
    titleKey: translationKey('Title.Table.CohortInterval', TranslationNamespace.Analytics),
    columnKey: SpecialCohortColumnKey.CohortInterval,
    columnType: ColumnType.Number,
  },
};

export const getDynamicCohortColumnKey = <ColumnKey extends string>(
  interval: number,
): ColumnKey => {
  return `Retention CohortInterval ${interval}` as ColumnKey;
};

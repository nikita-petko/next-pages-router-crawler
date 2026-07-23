import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import {
  ColumnType,
  type TableColumnConfig,
} from '@modules/charts-generic/tables/types/GenericColumnType';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

/**
 * Column configs
 */

export enum SpecialCohortColumnKey {
  Cohort = 'Cohort',
  CohortInterval = 'CohortInterval',
}

export const orderedAudienceExpansionFunnelColumnKeys = [
  SpecialCohortColumnKey.Cohort,
  RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelSignups,
  RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelReactivations,
  RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelPercentOfNewUsers,
  RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelRetentionD1,
  RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelRetentionD7,
  RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelPayerConversion7D,
  RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelRevenuePerPayer7D,
  RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelRevenuePerUser7D,
  RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelPayerConversion60D,
  RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelRevenuePerPayer60D,
  RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelRevenuePerUser60D,
  RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelEstimatedPayout,
] as const;
export type AudienceExpansionFunnelColumnKey =
  (typeof orderedAudienceExpansionFunnelColumnKeys)[number];

export const AudienceExpansionFunnelTableColumnConfig: Record<
  AudienceExpansionFunnelColumnKey,
  TableColumnConfig<AudienceExpansionFunnelColumnKey>
> = {
  [SpecialCohortColumnKey.Cohort]: {
    titleKey: translationKey('Title.Table.Cohort', TranslationNamespace.Analytics),
    tooltipKey: translationKey('Tooltip.Table.Cohort', TranslationNamespace.Analytics),
    columnKey: SpecialCohortColumnKey.Cohort,
    columnType: ColumnType.Text,
    widthWeight: 10,
  },
  [RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelSignups]: {
    titleKey: translationKey(
      'Label.Metric.CreatorRewardsAudienceExpansionFunnelSignups',
      TranslationNamespace.Analytics,
    ),
    columnKey: RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelSignups,
    columnType: ColumnType.Number,
  },
  [RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelReactivations]: {
    titleKey: translationKey(
      'Label.Metric.LifetimeQualifiedReactivationsV3',
      TranslationNamespace.Analytics,
    ),
    columnKey: RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelReactivations,
    columnType: ColumnType.Number,
  },
  [RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelPercentOfNewUsers]: {
    titleKey: translationKey(
      'Label.Metric.AEAudienceExpansionPercentage',
      TranslationNamespace.Analytics,
    ),
    columnKey: RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelPercentOfNewUsers,
    columnType: ColumnType.Number,
  },
  [RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelRetentionD1]: {
    titleKey: translationKey('Label.Metric.AERetentionD1', TranslationNamespace.Analytics),
    columnKey: RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelRetentionD1,
    columnType: ColumnType.Number,
  },
  [RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelRetentionD7]: {
    titleKey: translationKey('Label.Metric.AERetentionD7', TranslationNamespace.Analytics),
    columnKey: RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelRetentionD7,
    columnType: ColumnType.Number,
  },
  [RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelPayerConversion7D]: {
    titleKey: translationKey('Label.Metric.AEPayerConversion7D', TranslationNamespace.Analytics),
    columnKey: RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelPayerConversion7D,
    columnType: ColumnType.Number,
  },
  [RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelRevenuePerPayer7D]: {
    titleKey: translationKey('Label.Metric.AERevenuePerPayer7D', TranslationNamespace.Analytics),
    columnKey: RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelRevenuePerPayer7D,
    columnType: ColumnType.Number,
  },
  [RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelRevenuePerUser7D]: {
    titleKey: translationKey('Label.Metric.AERevenuePerUser7D', TranslationNamespace.Analytics),
    columnKey: RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelRevenuePerUser7D,
    columnType: ColumnType.Number,
  },
  [RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelPayerConversion60D]: {
    titleKey: translationKey('Label.Metric.AEPayerConversion60D', TranslationNamespace.Analytics),
    columnKey: RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelPayerConversion60D,
    columnType: ColumnType.Number,
  },
  [RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelRevenuePerPayer60D]: {
    titleKey: translationKey('Label.Metric.AERevenuePerPayer60D', TranslationNamespace.Analytics),
    columnKey: RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelRevenuePerPayer60D,
    columnType: ColumnType.Number,
  },
  [RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelRevenuePerUser60D]: {
    titleKey: translationKey('Label.Metric.AERevenuePerUser60D', TranslationNamespace.Analytics),
    columnKey: RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelRevenuePerUser60D,
    columnType: ColumnType.Number,
  },
  [RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelEstimatedPayout]: {
    titleKey: translationKey(
      'Label.Metric.CreatorRewardsLifetimeEstimatedAffiliatePayoutRobux',
      TranslationNamespace.Analytics,
    ),
    columnKey: RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelEstimatedPayout,
    columnType: ColumnType.Number,
  },
};

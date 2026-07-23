import { RAQIV2AcquisitionSource, RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { TAnalyticsSerializableTableConfig } from '../RAQIV2PredefinedTableConfig';
import {
  tableColumnConfigAcquisition1DPayerConversion,
  tableColumnConfigAcquisition1DPayerConversionMigration,
  tableColumnConfigAcquisition1DPlaytimePerUser,
  tableColumnConfigAcquisition1DPlaytimePerUserMigration,
  tableColumnConfigAcquisition1DRevenuePerUser,
  tableColumnConfigAcquisition1DRevenuePerUserMigration,
  tableColumnConfigAcquisition30DPayerConversion,
  tableColumnConfigAcquisition30DPayerConversionMigration,
  tableColumnConfigAcquisition30DPlaytimePerUser,
  tableColumnConfigAcquisition30DPlaytimePerUserMigration,
  tableColumnConfigAcquisition30DRevenuePerUser,
  tableColumnConfigAcquisition30DRevenuePerUserMigration,
  tableColumnConfigAcquisition7DPayerConversion,
  tableColumnConfigAcquisition7DPayerConversionMigration,
  tableColumnConfigAcquisition7DPlaytimePerUser,
  tableColumnConfigAcquisition7DPlaytimePerUserMigration,
  tableColumnConfigAcquisition7DRevenuePerUser,
  tableColumnConfigAcquisition7DRevenuePerUserMigration,
  tableColumnConfigAcquisitionConversionRate,
  tableColumnConfigAcquisitionD1Retention,
  tableColumnConfigAcquisitionD1RetentionMigration,
  tableColumnConfigAcquisitionD30Retention,
  tableColumnConfigAcquisitionD30RetentionMigration,
  tableColumnConfigAcquisitionD7Retention,
  tableColumnConfigAcquisitionD7RetentionMigration,
  tableColumnConfigAcquisitionQualifiedConversionRate,
  tableColumnConfigAcquisitionQualifiedConversionRateMigration,
  tableColumnConfigAcquisitionQualifiedUsersWithPlays,
  tableColumnConfigAcquisitionQualifiedUsersWithPlaysMigration,
  tableColumnConfigAcquisitionUsersDetailPageCTR,
  tableColumnConfigAcquisitionUsersDetailPageCTRMigration,
  tableColumnConfigAcquisitionUsersImpressionCTR,
  tableColumnConfigAcquisitionUsersImpressionCTRMigration,
  tableColumnConfigAcquisitionUsersWithDetailPageVisits,
  tableColumnConfigAcquisitionUsersWithDetailPageVisitsMigration,
  tableColumnConfigAcquisitionUsersWithImpressions,
  tableColumnConfigAcquisitionUsersWithImpressionsMigration,
  tableColumnConfigAcquisitionUsersWithPlays,
  tableColumnConfigAcquisitionUsersWithPlaysMigration,
  tableColumnConfigChurnRateRealtime,
  tableColumnConfigFunnelSessionsRealtime,
  tableColumnConfigFunnelUsersRealtime,
  tableColumnConfigShareLinkAcquisition30DPayerConversion,
  tableColumnConfigShareLinkAcquisition30DRevenuePerUser,
  tableColumnConfigShareLinkAcquisition7DPlaytimePerUser,
  tableColumnConfigShareLinkAcquisitionD7Retention,
  tableColumnConfigShareLinkAcquisitionQualifiedConversionRate,
  tableColumnConfigShareLinkAcquisitionQualifiedUsersWithPlays,
  tableColumnConfigShareLinkAcquisitionUsersWithDetailPageVisits,
  tableColumnConfigStepCompletionRateRealtime,
  tableColumnConfigTotalConversionRateRealtime,
  tableColumnConfigTransactionAmount,
  tableColumnConfigTransactionAmountMigration,
  tableColumnConfigTransactionCount,
  tableColumnConfigTransactionCountMigration,
  tableColumnConfigUserChurnRateRealtime,
  tableColumnConfigUserStepCompletionRateRealtime,
  tableColumnConfigUserTotalConversionRateRealtime,
} from './PredefinedTableColumnConfigLiterals';

const exhaustiveAcquisitionSources = [
  RAQIV2AcquisitionSource.HomeRecommendation,
  RAQIV2AcquisitionSource.Search,
  RAQIV2AcquisitionSource.Friends,
  RAQIV2AcquisitionSource.CrossGame,
  RAQIV2AcquisitionSource.SponsoredAds,
  RAQIV2AcquisitionSource.PortalAds,
  RAQIV2AcquisitionSource.Curation,
  RAQIV2AcquisitionSource.Charts,
  RAQIV2AcquisitionSource.SearchAds,
  RAQIV2AcquisitionSource.Others,
].map((value) => [{ dimension: RAQIV2Dimension.AcquisitionSource, value }]);

const exhaustiveAcquisitionMigrationSources = [
  RAQIV2AcquisitionSource.HomeRecommendation,
  RAQIV2AcquisitionSource.Search,
  RAQIV2AcquisitionSource.Friends,
  RAQIV2AcquisitionSource.CrossGame,
  RAQIV2AcquisitionSource.SponsoredAds,
  RAQIV2AcquisitionSource.PortalAds,
  RAQIV2AcquisitionSource.Curation,
  RAQIV2AcquisitionSource.Charts,
  RAQIV2AcquisitionSource.SearchAds,
  RAQIV2AcquisitionSource.Others,
].map((value) => [{ dimension: RAQIV2Dimension.AcquisitionSource, value }]);

/** Useful to ensure the table keys are unique */
enum TableKeys {
  NewUsersFunnelOverview = 'NewUsersFunnelOverview',
  NewUsersFunnelOverviewV2 = 'NewUsersFunnelOverviewV2',
  NewUsersFunnelOverviewV2Migration = 'NewUsersFunnelOverviewV2Migration',
  NewUsersFunnelAcquisition = 'NewUsersFunnelAcquisition',
  NewUsersFunnelAcquisitionV2 = 'NewUsersFunnelAcquisitionV2',
  NewUsersFunnelAcquisitionV2Migration = 'NewUsersFunnelAcquisitionV2Migration',
  NewUsersFunnelEngagement = 'NewUsersFunnelEngagement',
  NewUsersFunnelEngagementMigration = 'NewUsersFunnelEngagementMigration',
  NewUsersFunnelMonetization = 'NewUsersFunnelMonetization',
  NewUsersFunnelMonetizationMigration = 'NewUsersFunnelMonetizationMigration',
  ShareLinkAcquisitionOverview = 'ShareLinkAcquisitionOverview',
  InGameEconomyTransactions = 'InGameEconomyTransactions',
  InGameEconomyTransactionsMigration = 'InGameEconomyTransactionsMigration',
  FunnelsProgressionBySessionRealtime = 'FunnelsProgressionBySessionRealtime',
  FunnelsProgressionByUserRealtime = 'FunnelsProgressionByUserRealtime',
}

export const tableConfigNewUsersFunnelOverview = {
  type: AnalyticsComponentType.Table,
  tableKey: TableKeys.NewUsersFunnelOverview,
  tableConfig: {
    stickyHeader: true,
    stickyFirstColumn: true,
    columnDivider: true,
    defaultActiveSort: tableColumnConfigAcquisitionUsersWithPlays.key,
  },
  dataColumns: [
    tableColumnConfigAcquisitionUsersWithPlays,
    tableColumnConfigAcquisitionConversionRate,
    tableColumnConfigAcquisitionD7Retention,
    tableColumnConfigAcquisition7DPlaytimePerUser,
    tableColumnConfigAcquisition30DPayerConversion,
    tableColumnConfigAcquisition30DRevenuePerUser,
  ],
  breakdowns: [RAQIV2Dimension.AcquisitionSource],
  isTotalRowIncluded: true,
  requiredBreakdownRows: exhaustiveAcquisitionSources,
  pagination: null,
} as const satisfies TAnalyticsSerializableTableConfig;

export const tableConfigNewUsersFunnelOverviewV2 = {
  type: AnalyticsComponentType.Table,
  tableKey: TableKeys.NewUsersFunnelOverviewV2,
  tableConfig: {
    stickyHeader: true,
    stickyFirstColumn: true,
    columnDivider: true,
    defaultActiveSort: tableColumnConfigAcquisitionUsersWithPlays.key,
  },
  dataColumns: [
    tableColumnConfigAcquisitionUsersWithPlays,
    tableColumnConfigAcquisitionQualifiedConversionRate,
    tableColumnConfigAcquisitionD7Retention,
    tableColumnConfigAcquisition7DPlaytimePerUser,
    tableColumnConfigAcquisition30DPayerConversion,
    tableColumnConfigAcquisition30DRevenuePerUser,
  ],
  breakdowns: [RAQIV2Dimension.AcquisitionSource],
  isTotalRowIncluded: true,
  requiredBreakdownRows: exhaustiveAcquisitionSources,
  pagination: null,
} as const satisfies TAnalyticsSerializableTableConfig;

export const tableConfigNewUsersFunnelOverviewV2Migration = {
  type: AnalyticsComponentType.Table,
  tableKey: TableKeys.NewUsersFunnelOverviewV2Migration,
  tableConfig: {
    stickyHeader: true,
    stickyFirstColumn: true,
    columnDivider: true,
    defaultActiveSort: tableColumnConfigAcquisitionUsersWithPlaysMigration.key,
  },
  dataColumns: [
    tableColumnConfigAcquisitionUsersWithPlaysMigration,
    tableColumnConfigAcquisitionQualifiedConversionRateMigration,
    tableColumnConfigAcquisitionD7RetentionMigration,
    tableColumnConfigAcquisition7DPlaytimePerUserMigration,
    tableColumnConfigAcquisition30DPayerConversionMigration,
    tableColumnConfigAcquisition30DRevenuePerUserMigration,
  ],
  breakdowns: [RAQIV2Dimension.AcquisitionSource],
  isTotalRowIncluded: true,
  requiredBreakdownRows: exhaustiveAcquisitionMigrationSources,
  pagination: null,
} as const satisfies TAnalyticsSerializableTableConfig;

export const tableConfigNewUsersFunnelAcquisition = {
  type: AnalyticsComponentType.Table,
  tableKey: TableKeys.NewUsersFunnelAcquisition,
  tableConfig: {
    stickyHeader: true,
    stickyFirstColumn: true,
    columnDivider: true,
    defaultActiveSort: tableColumnConfigAcquisitionUsersWithImpressions.key,
  },
  dataColumns: [
    tableColumnConfigAcquisitionUsersWithImpressions,
    tableColumnConfigAcquisitionUsersImpressionCTR,
    tableColumnConfigAcquisitionUsersWithDetailPageVisits,
    tableColumnConfigAcquisitionUsersDetailPageCTR,
    tableColumnConfigAcquisitionUsersWithPlays,
    tableColumnConfigAcquisitionConversionRate,
  ],
  breakdowns: [RAQIV2Dimension.AcquisitionSource],
  isTotalRowIncluded: true,
  requiredBreakdownRows: exhaustiveAcquisitionSources,
  pagination: null,
} as const satisfies TAnalyticsSerializableTableConfig;

export const tableConfigNewUsersFunnelAcquisitionV2 = {
  type: AnalyticsComponentType.Table,
  tableKey: TableKeys.NewUsersFunnelAcquisitionV2,
  tableConfig: {
    stickyHeader: true,
    stickyFirstColumn: true,
    columnDivider: true,
    defaultActiveSort: tableColumnConfigAcquisitionUsersWithImpressions.key,
  },
  dataColumns: [
    tableColumnConfigAcquisitionUsersWithImpressions,
    tableColumnConfigAcquisitionUsersImpressionCTR,
    tableColumnConfigAcquisitionUsersWithDetailPageVisits,
    tableColumnConfigAcquisitionUsersDetailPageCTR,
    tableColumnConfigAcquisitionUsersWithPlays,
    tableColumnConfigAcquisitionQualifiedUsersWithPlays,
    tableColumnConfigAcquisitionQualifiedConversionRate,
  ],
  breakdowns: [RAQIV2Dimension.AcquisitionSource],
  isTotalRowIncluded: true,
  requiredBreakdownRows: exhaustiveAcquisitionSources,
  pagination: null,
} as const satisfies TAnalyticsSerializableTableConfig;

export const tableConfigNewUsersFunnelAcquisitionV2Migration = {
  type: AnalyticsComponentType.Table,
  tableKey: TableKeys.NewUsersFunnelAcquisitionV2Migration,
  tableConfig: {
    stickyHeader: true,
    stickyFirstColumn: true,
    columnDivider: true,
    defaultActiveSort: tableColumnConfigAcquisitionUsersWithImpressionsMigration.key,
  },
  dataColumns: [
    tableColumnConfigAcquisitionUsersWithImpressionsMigration,
    tableColumnConfigAcquisitionUsersImpressionCTRMigration,
    tableColumnConfigAcquisitionUsersWithDetailPageVisitsMigration,
    tableColumnConfigAcquisitionUsersDetailPageCTRMigration,
    tableColumnConfigAcquisitionUsersWithPlaysMigration,
    tableColumnConfigAcquisitionQualifiedUsersWithPlaysMigration,
    tableColumnConfigAcquisitionQualifiedConversionRateMigration,
  ],
  breakdowns: [RAQIV2Dimension.AcquisitionSource],
  isTotalRowIncluded: true,
  requiredBreakdownRows: exhaustiveAcquisitionMigrationSources,
  pagination: null,
} as const satisfies TAnalyticsSerializableTableConfig;

export const tableConfigNewUsersFunnelEngagement = {
  type: AnalyticsComponentType.Table,
  tableKey: TableKeys.NewUsersFunnelEngagement,
  tableConfig: {
    stickyHeader: true,
    stickyFirstColumn: true,
    columnDivider: true,
    defaultActiveSort: tableColumnConfigAcquisitionD1Retention.key,
  },
  dataColumns: [
    tableColumnConfigAcquisitionD1Retention,
    tableColumnConfigAcquisitionD7Retention,
    tableColumnConfigAcquisitionD30Retention,
    tableColumnConfigAcquisition1DPlaytimePerUser,
    tableColumnConfigAcquisition7DPlaytimePerUser,
    tableColumnConfigAcquisition30DPlaytimePerUser,
  ],
  breakdowns: [RAQIV2Dimension.AcquisitionSource],
  isTotalRowIncluded: true,
  requiredBreakdownRows: exhaustiveAcquisitionSources,
  pagination: null,
} as const satisfies TAnalyticsSerializableTableConfig;

export const tableConfigNewUsersFunnelEngagementMigration = {
  type: AnalyticsComponentType.Table,
  tableKey: TableKeys.NewUsersFunnelEngagementMigration,
  tableConfig: {
    stickyHeader: true,
    stickyFirstColumn: true,
    columnDivider: true,
    defaultActiveSort: tableColumnConfigAcquisitionD1RetentionMigration.key,
  },
  dataColumns: [
    tableColumnConfigAcquisitionD1RetentionMigration,
    tableColumnConfigAcquisitionD7RetentionMigration,
    tableColumnConfigAcquisitionD30RetentionMigration,
    tableColumnConfigAcquisition1DPlaytimePerUserMigration,
    tableColumnConfigAcquisition7DPlaytimePerUserMigration,
    tableColumnConfigAcquisition30DPlaytimePerUserMigration,
  ],
  breakdowns: [RAQIV2Dimension.AcquisitionSource],
  isTotalRowIncluded: true,
  requiredBreakdownRows: exhaustiveAcquisitionMigrationSources,
  pagination: null,
} as const satisfies TAnalyticsSerializableTableConfig;

export const tableConfigNewUsersFunnelMonetization = {
  type: AnalyticsComponentType.Table,
  tableKey: TableKeys.NewUsersFunnelMonetization,
  tableConfig: {
    stickyHeader: true,
    stickyFirstColumn: true,
    columnDivider: true,
    defaultActiveSort: tableColumnConfigAcquisition1DPayerConversion.key,
  },
  dataColumns: [
    tableColumnConfigAcquisition1DPayerConversion,
    tableColumnConfigAcquisition7DPayerConversion,
    tableColumnConfigAcquisition30DPayerConversion,
    tableColumnConfigAcquisition1DRevenuePerUser,
    tableColumnConfigAcquisition7DRevenuePerUser,
    tableColumnConfigAcquisition30DRevenuePerUser,
  ],
  breakdowns: [RAQIV2Dimension.AcquisitionSource],
  isTotalRowIncluded: true,
  requiredBreakdownRows: exhaustiveAcquisitionSources,
  pagination: null,
} as const satisfies TAnalyticsSerializableTableConfig;

export const tableConfigNewUsersFunnelMonetizationMigration = {
  type: AnalyticsComponentType.Table,
  tableKey: TableKeys.NewUsersFunnelMonetizationMigration,
  tableConfig: {
    stickyHeader: true,
    stickyFirstColumn: true,
    columnDivider: true,
    defaultActiveSort: tableColumnConfigAcquisition1DPayerConversionMigration.key,
  },
  dataColumns: [
    tableColumnConfigAcquisition1DPayerConversionMigration,
    tableColumnConfigAcquisition7DPayerConversionMigration,
    tableColumnConfigAcquisition30DPayerConversionMigration,
    tableColumnConfigAcquisition1DRevenuePerUserMigration,
    tableColumnConfigAcquisition7DRevenuePerUserMigration,
    tableColumnConfigAcquisition30DRevenuePerUserMigration,
  ],
  breakdowns: [RAQIV2Dimension.AcquisitionSource],
  isTotalRowIncluded: true,
  requiredBreakdownRows: exhaustiveAcquisitionMigrationSources,
  pagination: null,
} as const satisfies TAnalyticsSerializableTableConfig;

export const tableConfigShareLinkAcquisitionOverview = {
  type: AnalyticsComponentType.Table,
  tableKey: TableKeys.ShareLinkAcquisitionOverview,
  tableConfig: {
    stickyHeader: true,
    stickyFirstColumn: true,
    columnDivider: true,
    defaultActiveSort: tableColumnConfigShareLinkAcquisitionUsersWithDetailPageVisits.key,
  },
  dataColumns: [
    tableColumnConfigShareLinkAcquisitionUsersWithDetailPageVisits,
    tableColumnConfigShareLinkAcquisitionQualifiedConversionRate,
    tableColumnConfigShareLinkAcquisitionQualifiedUsersWithPlays,
    tableColumnConfigShareLinkAcquisitionD7Retention,
    tableColumnConfigShareLinkAcquisition7DPlaytimePerUser,
    tableColumnConfigShareLinkAcquisition30DPayerConversion,
    tableColumnConfigShareLinkAcquisition30DRevenuePerUser,
  ],
  breakdowns: [RAQIV2Dimension.CampaignName],
  isTotalRowIncluded: false,
  pagination: null,
  titleKey: translationKey('Title.Table.NewUsersFunnelV2', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.Table.ShareLinkNewUsersFunnel',
    TranslationNamespace.Analytics,
  ),
} as const satisfies TAnalyticsSerializableTableConfig;

export const tableConfigInGameEconomyTransactions = {
  type: AnalyticsComponentType.Table,
  tableKey: TableKeys.InGameEconomyTransactions,
  tableConfig: {
    stickyHeader: true,
    stickyFirstColumn: false,
    columnDivider: true,
    defaultActiveSort: tableColumnConfigTransactionCount.key,
  },
  dataColumns: [tableColumnConfigTransactionCount, tableColumnConfigTransactionAmount],
  breakdowns: [RAQIV2Dimension.ItemSku, RAQIV2Dimension.FlowType, RAQIV2Dimension.TransactionType],
  isTotalRowIncluded: false,
  titleKey: translationKey('Title.Table.AllSourcesAndSinks', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.Table.AllSourcesAndSinks',
    TranslationNamespace.Analytics,
  ),
} as const satisfies TAnalyticsSerializableTableConfig;

export const tableConfigInGameEconomyTransactionsMigration = {
  type: AnalyticsComponentType.Table,
  tableKey: TableKeys.InGameEconomyTransactionsMigration,
  tableConfig: {
    stickyHeader: true,
    stickyFirstColumn: false,
    columnDivider: true,
    defaultActiveSort: tableColumnConfigTransactionCountMigration.key,
  },
  dataColumns: [
    tableColumnConfigTransactionCountMigration,
    tableColumnConfigTransactionAmountMigration,
  ],
  pagination: { initialPageSize: 10, pageSizeOptions: [10, 25, 50, 100] },
  breakdowns: [RAQIV2Dimension.ItemSku, RAQIV2Dimension.FlowType, RAQIV2Dimension.TransactionType],
  isTotalRowIncluded: false,
  titleKey: translationKey('Title.Table.AllSourcesAndSinks', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.Table.AllSourcesAndSinks',
    TranslationNamespace.Analytics,
  ),
} as const satisfies TAnalyticsSerializableTableConfig;

export const tableConfigFunnelsProgressionBySessionRealtime = {
  type: AnalyticsComponentType.Table,
  tableKey: TableKeys.FunnelsProgressionBySessionRealtime,
  tableConfig: {
    stickyHeader: true,
    stickyFirstColumn: true,
    columnDivider: true,
    defaultActiveSort: RAQIV2Dimension.FunnelStep,
  },
  dataColumns: [
    tableColumnConfigFunnelSessionsRealtime,
    tableColumnConfigStepCompletionRateRealtime,
    tableColumnConfigChurnRateRealtime,
    tableColumnConfigTotalConversionRateRealtime,
  ],
  breakdowns: [RAQIV2Dimension.FunnelStep],
  isTotalRowIncluded: false,
  pagination: null,
} as const satisfies TAnalyticsSerializableTableConfig;

export const tableConfigFunnelsProgressionByUserRealtime = {
  type: AnalyticsComponentType.Table,
  tableKey: TableKeys.FunnelsProgressionByUserRealtime,
  tableConfig: {
    stickyHeader: true,
    stickyFirstColumn: true,
    columnDivider: true,
    defaultActiveSort: RAQIV2Dimension.FunnelStep,
  },
  dataColumns: [
    tableColumnConfigFunnelUsersRealtime,
    tableColumnConfigUserStepCompletionRateRealtime,
    tableColumnConfigUserChurnRateRealtime,
    tableColumnConfigUserTotalConversionRateRealtime,
  ],
  breakdowns: [RAQIV2Dimension.FunnelStep],
  isTotalRowIncluded: false,
  pagination: null,
} as const satisfies TAnalyticsSerializableTableConfig;

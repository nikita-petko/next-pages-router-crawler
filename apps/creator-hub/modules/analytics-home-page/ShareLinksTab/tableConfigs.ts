import {
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { AnalyticsTabbedTableConfig as TabbedTableConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedTabbedTableConfigs';
import type { TAnalyticsMetricTableColumnConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedTableColumnConfig';
import type { TAnalyticsSerializableTableConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedTableConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export const tableColumnConfigShareLinksBookingsPerReactivationSpender = {
  key: 'AffiliateLinkDailyAverageRobuxBookingsPerReactivationSpender',
  metric: RAQIV2Metric.AffiliateLinkDailyAverageRobuxBookingsPerReactivationSpender,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.AffiliateLinkDailyCampaignName],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigShareLinksBookingsPerSignupSpender = {
  key: 'AffiliateLinkDailyAverageRobuxBookingsPerSignupSpender',
  metric: RAQIV2Metric.AffiliateLinkDailyAverageRobuxBookingsPerSignupSpender,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.AffiliateLinkDailyCampaignName],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigShareLinksLifetimeEstimatedAffiliateActiveSpenderReactivationsPayout =
  {
    key: 'AffiliateLinkDailyAffiliateActiveSpenderReactivationsPayoutRobux',
    metric: RAQIV2Metric.AffiliateLinkDailyAffiliateActiveSpenderReactivationsPayoutRobux,
    overrides: {
      breakdown: {
        override: [RAQIV2Dimension.AffiliateLinkDailyCampaignName],
      },
      granularity: { override: RAQIV2MetricGranularity.None },
    },
  } as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigShareLinksLifetimeEstimatedAffiliateCombinedPayout = {
  key: 'AffiliateLinkDailyTotalPayoutRobux',
  metric: RAQIV2Metric.AffiliateLinkDailyTotalPayoutRobux,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.AffiliateLinkDailyCampaignName],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigShareLinksLifetimeEstimatedAffiliateReactivationsPayout = {
  key: 'AffiliateLinkDailyAffiliateReactivationsPayoutRobux',
  metric: RAQIV2Metric.AffiliateLinkDailyAffiliateReactivationsPayoutRobux,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.AffiliateLinkDailyCampaignName],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigShareLinksLifetimeEstimatedAffiliateSignupsPayout = {
  key: 'AffiliateLinkDailyAffiliateSignupsPayoutRobux',
  metric: RAQIV2Metric.AffiliateLinkDailyAffiliateSignupsPayoutRobux,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.AffiliateLinkDailyCampaignName],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigShareLinksLifetimeQualifiedActiveSpenderReactivations = {
  key: 'AffiliateLinkDailyQualifiedActiveSpenderReactivations',
  metric: RAQIV2Metric.AffiliateLinkDailyQualifiedActiveSpenderReactivations,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.AffiliateLinkDailyCampaignName],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigShareLinksLifetimeQualifiedReactivationsBookings = {
  key: 'AffiliateLinkDailyQualifiedReactivationsBookingsRobux',
  metric: RAQIV2Metric.AffiliateLinkDailyQualifiedReactivationsBookingsRobux,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.AffiliateLinkDailyCampaignName],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigShareLinksLifetimeQualifiedReactivationsSpenders = {
  key: 'AffiliateLinkDailyQualifiedReactivationsSpenders',
  metric: RAQIV2Metric.AffiliateLinkDailyQualifiedReactivationsSpenders,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.AffiliateLinkDailyCampaignName],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigShareLinksLifetimeQualifiedReactivations = {
  key: 'AffiliateLinkDailyQualifiedReactivations',
  metric: RAQIV2Metric.AffiliateLinkDailyQualifiedReactivations,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.AffiliateLinkDailyCampaignName],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigShareLinksLifetimeQualifiedSignupSpenders = {
  key: 'AffiliateLinkDailyQualifiedSignupSpenders',
  metric: RAQIV2Metric.AffiliateLinkDailyQualifiedSignupSpenders,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.AffiliateLinkDailyCampaignName],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigShareLinksLifetimeQualifiedSignupsBookings = {
  key: 'AffiliateLinkDailyQualifiedSignupsBookingsRobux',
  metric: RAQIV2Metric.AffiliateLinkDailyQualifiedSignupsBookingsRobux,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.AffiliateLinkDailyCampaignName],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigShareLinksLifetimeCombinedBookings = {
  key: 'AffiliateLinkDailyBookingsPerSpenderCombined',
  metric: RAQIV2Metric.AffiliateLinkDailyBookingsPerSpenderCombined,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.AffiliateLinkDailyCampaignName],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigShareLinksLifetimeQualifiedSignups = {
  key: 'AffiliateLinkDailyQualifiedSignups',
  metric: RAQIV2Metric.AffiliateLinkDailyQualifiedSignups,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.AffiliateLinkDailyCampaignName],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigShareLinksLifetimeVisits = {
  key: 'AffiliateLinkDailyVisits',
  metric: RAQIV2Metric.AffiliateLinkDailyVisits,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.AffiliateLinkDailyCampaignName],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

/// table configs

export const tableConfigCreatorRewardsStarCodeShareLinksAllUsers = {
  type: AnalyticsComponentType.Table,
  tableKey: 'CreatorRewardsShareLinksStarCodeAllUsers',
  tableConfig: {
    stickyHeader: true,
    stickyFirstColumn: true,
    columnDivider: false,
  },
  dataColumns: [
    tableColumnConfigShareLinksLifetimeVisits,
    tableColumnConfigShareLinksLifetimeQualifiedActiveSpenderReactivations,
    tableColumnConfigShareLinksLifetimeQualifiedSignups,
    tableColumnConfigShareLinksLifetimeQualifiedReactivations,
    tableColumnConfigShareLinksLifetimeQualifiedReactivationsSpenders,
    tableColumnConfigShareLinksLifetimeCombinedBookings,
    tableColumnConfigShareLinksLifetimeEstimatedAffiliateCombinedPayout,
  ],
  breakdowns: [RAQIV2Dimension.AffiliateLinkDailyCampaignName],
  isTotalRowIncluded: true,
} as const satisfies TAnalyticsSerializableTableConfig;

export const tableConfigCreatorRewardsShareLinksAllUsers = {
  type: AnalyticsComponentType.Table,
  tableKey: 'CreatorRewardsShareLinksAllUsers',
  tableConfig: {
    stickyHeader: true,
    stickyFirstColumn: true,
    columnDivider: false,
  },
  dataColumns: [
    tableColumnConfigShareLinksLifetimeVisits,
    tableColumnConfigShareLinksLifetimeQualifiedSignups,
    tableColumnConfigShareLinksLifetimeQualifiedReactivations,
    tableColumnConfigShareLinksLifetimeQualifiedReactivationsSpenders,
    tableColumnConfigShareLinksLifetimeCombinedBookings,
    tableColumnConfigShareLinksLifetimeEstimatedAffiliateCombinedPayout,
  ],
  breakdowns: [RAQIV2Dimension.AffiliateLinkDailyCampaignName],
  isTotalRowIncluded: true,
} as const satisfies TAnalyticsSerializableTableConfig;

export const tableConfigCreatorRewardsShareLinksNewUsers = {
  type: AnalyticsComponentType.Table,
  tableKey: 'CreatorRewardsShareLinksNewUsers',
  tableConfig: {
    stickyHeader: true,
    stickyFirstColumn: true,
    columnDivider: false,
  },
  dataColumns: [
    tableColumnConfigShareLinksLifetimeQualifiedSignups,
    tableColumnConfigShareLinksLifetimeQualifiedSignupSpenders,
    tableColumnConfigShareLinksBookingsPerSignupSpender,
    tableColumnConfigShareLinksLifetimeEstimatedAffiliateSignupsPayout,
  ],
  breakdowns: [RAQIV2Dimension.AffiliateLinkDailyCampaignName],
  isTotalRowIncluded: true,
} as const satisfies TAnalyticsSerializableTableConfig;

export const tableConfigCreatorRewardsShareLinksReactivatedUsers = {
  type: AnalyticsComponentType.Table,
  tableKey: 'CreatorRewardsShareLinksReactivatedUsers',
  tableConfig: {
    stickyHeader: true,
    stickyFirstColumn: true,
    columnDivider: false,
  },
  dataColumns: [
    tableColumnConfigShareLinksLifetimeQualifiedReactivations,
    tableColumnConfigShareLinksLifetimeQualifiedReactivationsSpenders,
    tableColumnConfigShareLinksBookingsPerReactivationSpender,
    tableColumnConfigShareLinksLifetimeEstimatedAffiliateReactivationsPayout,
  ],
  breakdowns: [RAQIV2Dimension.AffiliateLinkDailyCampaignName],
  isTotalRowIncluded: true,
} as const satisfies TAnalyticsSerializableTableConfig;

export const tableConfigCreatorRewardsShareLinksActiveSpenders = {
  type: AnalyticsComponentType.Table,
  tableKey: 'CreatorRewardsShareLinksStarCodeActiveSpenders',
  tableConfig: {
    stickyHeader: true,
    stickyFirstColumn: true,
    columnDivider: false,
  },
  dataColumns: [
    tableColumnConfigShareLinksLifetimeQualifiedActiveSpenderReactivations,
    tableColumnConfigShareLinksLifetimeEstimatedAffiliateActiveSpenderReactivationsPayout,
  ],
  breakdowns: [RAQIV2Dimension.AffiliateLinkDailyCampaignName],
  isTotalRowIncluded: true,
} as const satisfies TAnalyticsSerializableTableConfig;

/// tabbed table configs

export const tabbedTableConfigCreatorRewardsShareLinksStarCode = {
  type: AnalyticsComponentType.TabbedTable,
  tableKey: 'CreatorRewardsShareLinks',
  tabs: [
    {
      key: 'CreatorRewardsShareLinksStarCodeAllUsers',
      config: tableConfigCreatorRewardsStarCodeShareLinksAllUsers,
      labelKey: translationKey('Title.AllUsers', TranslationNamespace.Analytics),
    },
    {
      key: 'CreatorRewardsShareLinksNewUsers',
      config: tableConfigCreatorRewardsShareLinksNewUsers,
      labelKey: translationKey('Title.NewUsers', TranslationNamespace.Analytics),
    },
    {
      key: 'CreatorRewardsShareLinksReactivatedUsers',
      config: tableConfigCreatorRewardsShareLinksReactivatedUsers,
      labelKey: translationKey('Title.ReactivatedUsers', TranslationNamespace.Analytics),
    },
    {
      key: 'CreatorRewardsShareLinksStarCodeActiveSpenders',
      config: tableConfigCreatorRewardsShareLinksActiveSpenders,
      labelKey: translationKey('Title.ActiveSpenders', TranslationNamespace.Analytics),
    },
  ],
  tabMobileLabelKey: translationKey('Title.LinkMetrics', TranslationNamespace.Analytics),
  titleKey: translationKey('Title.LinkMetrics', TranslationNamespace.Analytics),
  tooltipKey: translationKey('Description.LinkMetrics', TranslationNamespace.Analytics),
} as const satisfies TabbedTableConfig;

export const tabbedTableConfigCreatorRewardsShareLinks = {
  type: AnalyticsComponentType.TabbedTable,
  tableKey: 'CreatorRewardsShareLinks',
  tabs: [
    {
      key: 'CreatorRewardsShareLinksAllUsers',
      config: tableConfigCreatorRewardsShareLinksAllUsers,
      labelKey: translationKey('Title.AllUsers', TranslationNamespace.Analytics),
    },
    {
      key: 'CreatorRewardsShareLinksNewUsers',
      config: tableConfigCreatorRewardsShareLinksNewUsers,
      labelKey: translationKey('Title.NewUsers', TranslationNamespace.Analytics),
    },
    {
      key: 'CreatorRewardsShareLinksReactivatedUsers',
      config: tableConfigCreatorRewardsShareLinksReactivatedUsers,
      labelKey: translationKey('Title.ReactivatedUsers', TranslationNamespace.Analytics),
    },
  ],
  tabMobileLabelKey: translationKey('Title.LinkMetrics', TranslationNamespace.Analytics),
  titleKey: translationKey('Title.LinkMetrics', TranslationNamespace.Analytics),
  tooltipKey: translationKey('Description.LinkMetrics', TranslationNamespace.Analytics),
} as const satisfies TabbedTableConfig;

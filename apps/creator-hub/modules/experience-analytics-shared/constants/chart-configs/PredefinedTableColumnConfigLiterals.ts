import {
  RAQIV2Dimension,
  RAQIV2IsNewUser,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { TAnalyticsMetricTableColumnConfig } from '../RAQIV2PredefinedTableColumnConfig';

enum RAQIV2PredefinedTableColumnKey {
  AcquisitionUsersWithPlays = 'AcquisitionUsersWithPlays',
  AcquisitionQualifiedUsersWithPlays = 'AcquisitionQualifiedUsersWithPlays',
  AcquisitionConversionRate = 'AcquisitionConversionRate',
  AcquisitionQualifiedConversionRate = 'AcquisitionQualifiedConversionRate',
  AcquisitionUsersWithImpressions = 'AcquisitionUsersWithImpressions',
  AcquisitionUsersImpressionCTR = 'AcquisitionUsersImpressionCTR',
  AcquisitionUsersWithDetailPageVisits = 'AcquisitionUsersWithDetailPageVisits',
  AcquisitionUsersDetailPageCTR = 'AcquisitionUsersDetailPageCTR',
  AcquisitionD1Retention = 'AcquisitionD1Retention',
  AcquisitionD7Retention = 'AcquisitionD7Retention',
  AcquisitionD30Retention = 'AcquisitionD30Retention',
  Acquisition1DPlaytimePerUser = 'Acquisition1DPlaytimePerUser',
  Acquisition7DPlaytimePerUser = 'Acquisition7DPlaytimePerUser',
  Acquisition30DPlaytimePerUser = 'Acquisition30DPlaytimePerUser',
  Acquisition1DPayerConversion = 'Acquisition1DPayerConversion',
  Acquisition7DPayerConversion = 'Acquisition7DPayerConversion',
  Acquisition30DPayerConversion = 'Acquisition30DPayerConversion',
  Acquisition1DRevenuePerUser = 'Acquisition1DRevenuePerUser',
  Acquisition7DRevenuePerUser = 'Acquisition7DRevenuePerUser',
  Acquisition30DRevenuePerUser = 'Acquisition30DRevenuePerUser',

  AcquisitionUsersWithPlaysMigration = 'AcquisitionUsersWithPlaysMigration',
  AcquisitionQualifiedUsersWithPlaysMigration = 'AcquisitionQualifiedUsersWithPlaysMigration',
  AcquisitionConversionRateMigration = 'AcquisitionConversionRateMigration',
  AcquisitionQualifiedConversionRateMigration = 'AcquisitionQualifiedConversionRateMigration',
  AcquisitionUsersWithImpressionsMigration = 'AcquisitionUsersWithImpressionsMigration',
  AcquisitionUsersImpressionCTRMigration = 'AcquisitionUsersImpressionCTRMigration',
  AcquisitionUsersWithDetailPageVisitsMigration = 'AcquisitionUsersWithDetailPageVisitsMigration',
  AcquisitionUsersDetailPageCTRMigration = 'AcquisitionUsersDetailPageCTRMigration',
  AcquisitionD1RetentionMigration = 'AcquisitionD1RetentionMigration',
  AcquisitionD7RetentionMigration = 'AcquisitionD7RetentionMigration',
  AcquisitionD30RetentionMigration = 'AcquisitionD30RetentionMigration',
  Acquisition1DPlaytimePerUserMigration = 'Acquisition1DPlaytimePerUserMigration',
  Acquisition7DPlaytimePerUserMigration = 'Acquisition7DPlaytimePerUserMigration',
  Acquisition30DPlaytimePerUserMigration = 'Acquisition30DPlaytimePerUserMigration',
  Acquisition1DPayerConversionMigration = 'Acquisition1DPayerConversionMigration',
  Acquisition7DPayerConversionMigration = 'Acquisition7DPayerConversionMigration',
  Acquisition30DPayerConversionMigration = 'Acquisition30DPayerConversionMigration',
  Acquisition1DRevenuePerUserMigration = 'Acquisition1DRevenuePerUserMigration',
  Acquisition7DRevenuePerUserMigration = 'Acquisition7DRevenuePerUserMigration',
  Acquisition30DRevenuePerUserMigration = 'Acquisition30DRevenuePerUserMigration',

  ShareLinkAcquisitionUsersWithPlays = 'ShareLinkAcquisitionUsersWithPlays',
  ShareLinkAcquisitionQualifiedUsersWithPlays = 'ShareLinkAcquisitionQualifiedUsersWithPlays',
  ShareLinkAcquisitionConversionRate = 'ShareLinkAcquisitionConversionRate',
  ShareLinkAcquisitionQualifiedConversionRate = 'ShareLinkAcquisitionQualifiedConversionRate',
  ShareLinkAcquisitionUsersWithDetailPageVisits = 'ShareLinkAcquisitionUsersWithDetailPageVisits',
  ShareLinkAcquisitionD1Retention = 'ShareLinkAcquisitionD1Retention',
  ShareLinkAcquisitionD7Retention = 'ShareLinkAcquisitionD7Retention',
  ShareLinkAcquisitionD30Retention = 'ShareLinkAcquisitionD30Retention',
  ShareLinkAcquisition1DPlaytimePerUser = 'ShareLinkAcquisition1DPlaytimePerUser',
  ShareLinkAcquisition7DPlaytimePerUser = 'ShareLinkAcquisition7DPlaytimePerUser',
  ShareLinkAcquisition30DPlaytimePerUser = 'ShareLinkAcquisition30DPlaytimePerUser',
  ShareLinkAcquisition1DPayerConversion = 'ShareLinkAcquisition1DPayerConversion',
  ShareLinkAcquisition7DPayerConversion = 'ShareLinkAcquisition7DPayerConversion',
  ShareLinkAcquisition30DPayerConversion = 'ShareLinkAcquisition30DPayerConversion',
  ShareLinkAcquisition1DRevenuePerUser = 'ShareLinkAcquisition1DRevenuePerUser',
  ShareLinkAcquisition7DRevenuePerUser = 'ShareLinkAcquisition7DRevenuePerUser',
  ShareLinkAcquisition30DRevenuePerUser = 'ShareLinkAcquisition30DRevenuePerUser',

  TransactionCount = 'TransactionCount',
  TransactionAmount = 'TransactionAmount',
  TransactionCountMigration = 'TransactionCountMigration',
  TransactionAmountMigration = 'TransactionAmountMigration',

  ItemSalesByExperienceCountDaily = 'ItemSalesByExperienceCountDaily',

  StoreTransactionCount = 'StoreTransactionCount',
  StoreRevenueAmount = 'StoreTransactionAmount',

  StepCompletionRateRealtime = 'StepCompletionRateRealtime',
  ChurnRateRealtime = 'ChurnRateRealtime',
  TotalConversionRateRealtime = 'TotalConversionRateRealtime',
  UserStepCompletionRateRealtime = 'UserStepCompletionRateRealtime',
  UserChurnRateRealtime = 'UserChurnRateRealtime',
  UserTotalConversionRateRealtime = 'UserTotalConversionRateRealtime',
  FunnelSessionsRealtime = 'FunnelSessionsRealtime',
  FunnelUsersRealtime = 'FunnelUsersRealtime',

  ThumbnailWinningSegments = 'ThumbnailWinningSegments',
  ThumbnailImpressions = 'ThumbnailImpressions',
  ThumbnailQualifiedPlays = 'ThumbnailQualifiedPlays',
  ThumbnailQualifiedPTR = 'ThumbnailQualifiedPTR',
  ThumbnailAVGPlayTime = 'ThumbnailAVGPlayTime',
}

export const tableColumnConfigAcquisitionUsersWithPlays = {
  key: RAQIV2PredefinedTableColumnKey.AcquisitionUsersWithPlays,
  metric: RAQIV2Metric.UniqueUsersWithPlaySessions,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.New],
        },
      ],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisitionQualifiedUsersWithPlays = {
  key: RAQIV2PredefinedTableColumnKey.AcquisitionQualifiedUsersWithPlays,
  metric: RAQIV2Metric.QualifiedUniqueUsersWithPlaySessions,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.New],
        },
      ],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisitionConversionRate = {
  key: RAQIV2PredefinedTableColumnKey.AcquisitionConversionRate,
  metric: RAQIV2Metric.EndToEndCVR,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.New],
        },
      ],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisitionQualifiedConversionRate = {
  key: RAQIV2PredefinedTableColumnKey.AcquisitionQualifiedConversionRate,
  metric: RAQIV2Metric.QualifiedEndToEndCVR,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.New],
        },
      ],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisitionUsersWithImpressions = {
  key: RAQIV2PredefinedTableColumnKey.AcquisitionUsersWithImpressions,
  metric: RAQIV2Metric.UniqueUsersWithImpressions,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.New],
        },
      ],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisitionUsersImpressionCTR = {
  key: RAQIV2PredefinedTableColumnKey.AcquisitionUsersImpressionCTR,
  metric: RAQIV2Metric.ImpressionCVR,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.New],
        },
      ],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisitionUsersWithDetailPageVisits = {
  key: RAQIV2PredefinedTableColumnKey.AcquisitionUsersWithDetailPageVisits,
  metric: RAQIV2Metric.UniqueUsersWithClicks,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.New],
        },
      ],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisitionUsersDetailPageCTR = {
  key: RAQIV2PredefinedTableColumnKey.AcquisitionUsersDetailPageCTR,
  metric: RAQIV2Metric.ClickCVR,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.New],
        },
      ],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisitionD1Retention = {
  key: RAQIV2PredefinedTableColumnKey.AcquisitionD1Retention,
  metric: RAQIV2Metric.AttributionD1RetentionRatio,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisitionD7Retention = {
  key: RAQIV2PredefinedTableColumnKey.AcquisitionD7Retention,
  metric: RAQIV2Metric.AttributionD7RetentionRatio,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisitionD30Retention = {
  key: RAQIV2PredefinedTableColumnKey.AcquisitionD30Retention,
  metric: RAQIV2Metric.AttributionD30RetentionRatio,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisition1DPlaytimePerUser = {
  key: RAQIV2PredefinedTableColumnKey.Acquisition1DPlaytimePerUser,
  metric: RAQIV2Metric.Attribution1DPlaytimePerUserInMinutes,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisition7DPlaytimePerUser = {
  key: RAQIV2PredefinedTableColumnKey.Acquisition7DPlaytimePerUser,
  metric: RAQIV2Metric.Attribution7DPlaytimePerUserInMinutes,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisition30DPlaytimePerUser = {
  key: RAQIV2PredefinedTableColumnKey.Acquisition30DPlaytimePerUser,
  metric: RAQIV2Metric.Attribution30DPlaytimePerUserInMinutes,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisition1DPayerConversion = {
  key: RAQIV2PredefinedTableColumnKey.Acquisition1DPayerConversion,
  metric: RAQIV2Metric.Attribution1DPayerConversionRatio,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisition7DPayerConversion = {
  key: RAQIV2PredefinedTableColumnKey.Acquisition7DPayerConversion,
  metric: RAQIV2Metric.Attribution7DPayerConversionRatio,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisition30DPayerConversion = {
  key: RAQIV2PredefinedTableColumnKey.Acquisition30DPayerConversion,
  metric: RAQIV2Metric.Attribution30DPayerConversionRatio,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisition1DRevenuePerUser = {
  key: RAQIV2PredefinedTableColumnKey.Acquisition1DRevenuePerUser,
  metric: RAQIV2Metric.Attribution1DRobuxPerUser,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisition7DRevenuePerUser = {
  key: RAQIV2PredefinedTableColumnKey.Acquisition7DRevenuePerUser,
  metric: RAQIV2Metric.Attribution7DRobuxPerUser,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisition30DRevenuePerUser = {
  key: RAQIV2PredefinedTableColumnKey.Acquisition30DRevenuePerUser,
  metric: RAQIV2Metric.Attribution30DRobuxPerUser,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisitionUsersWithPlaysMigration = {
  key: RAQIV2PredefinedTableColumnKey.AcquisitionUsersWithPlaysMigration,
  metric: RAQIV2Metric.UniqueUsersWithPlaySessionsMigration,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.New],
        },
      ],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisitionQualifiedUsersWithPlaysMigration = {
  key: RAQIV2PredefinedTableColumnKey.AcquisitionQualifiedUsersWithPlaysMigration,
  metric: RAQIV2Metric.QualifiedUniqueUsersWithPlaySessionsMigration,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.New],
        },
      ],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisitionConversionRateMigration = {
  key: RAQIV2PredefinedTableColumnKey.AcquisitionConversionRateMigration,
  metric: RAQIV2Metric.EndToEndCVRMigration,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.New],
        },
      ],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisitionQualifiedConversionRateMigration = {
  key: RAQIV2PredefinedTableColumnKey.AcquisitionQualifiedConversionRateMigration,
  metric: RAQIV2Metric.QualifiedEndToEndCVRMigration,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.New],
        },
      ],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisitionUsersWithImpressionsMigration = {
  key: RAQIV2PredefinedTableColumnKey.AcquisitionUsersWithImpressionsMigration,
  metric: RAQIV2Metric.UniqueUsersWithImpressionsMigration,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.New],
        },
      ],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisitionUsersImpressionCTRMigration = {
  key: RAQIV2PredefinedTableColumnKey.AcquisitionUsersImpressionCTRMigration,
  metric: RAQIV2Metric.ImpressionCVRMigration,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.New],
        },
      ],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisitionUsersWithDetailPageVisitsMigration = {
  key: RAQIV2PredefinedTableColumnKey.AcquisitionUsersWithDetailPageVisitsMigration,
  metric: RAQIV2Metric.UniqueUsersWithClicksMigration,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.New],
        },
      ],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisitionUsersDetailPageCTRMigration = {
  key: RAQIV2PredefinedTableColumnKey.AcquisitionUsersDetailPageCTRMigration,
  metric: RAQIV2Metric.ClickCVRMigration,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.New],
        },
      ],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisitionD1RetentionMigration = {
  key: RAQIV2PredefinedTableColumnKey.AcquisitionD1RetentionMigration,
  metric: RAQIV2Metric.AttributionD1RetentionRatioMigration,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisitionD7RetentionMigration = {
  key: RAQIV2PredefinedTableColumnKey.AcquisitionD7RetentionMigration,
  metric: RAQIV2Metric.AttributionD7RetentionRatioMigration,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisitionD30RetentionMigration = {
  key: RAQIV2PredefinedTableColumnKey.AcquisitionD30RetentionMigration,
  metric: RAQIV2Metric.AttributionD30RetentionRatioMigration,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisition1DPlaytimePerUserMigration = {
  key: RAQIV2PredefinedTableColumnKey.Acquisition1DPlaytimePerUserMigration,
  metric: RAQIV2Metric.Attribution1DPlaytimePerUserInMinutesMigration,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisition7DPlaytimePerUserMigration = {
  key: RAQIV2PredefinedTableColumnKey.Acquisition7DPlaytimePerUserMigration,
  metric: RAQIV2Metric.Attribution7DPlaytimePerUserInMinutesMigration,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisition30DPlaytimePerUserMigration = {
  key: RAQIV2PredefinedTableColumnKey.Acquisition30DPlaytimePerUserMigration,
  metric: RAQIV2Metric.Attribution30DPlaytimePerUserInMinutesMigration,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisition1DPayerConversionMigration = {
  key: RAQIV2PredefinedTableColumnKey.Acquisition1DPayerConversionMigration,
  metric: RAQIV2Metric.Attribution1DPayerConversionRatioMigration,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisition7DPayerConversionMigration = {
  key: RAQIV2PredefinedTableColumnKey.Acquisition7DPayerConversionMigration,
  metric: RAQIV2Metric.Attribution7DPayerConversionRatioMigration,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisition30DPayerConversionMigration = {
  key: RAQIV2PredefinedTableColumnKey.Acquisition30DPayerConversionMigration,
  metric: RAQIV2Metric.Attribution30DPayerConversionRatioMigration,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisition1DRevenuePerUserMigration = {
  key: RAQIV2PredefinedTableColumnKey.Acquisition1DRevenuePerUserMigration,
  metric: RAQIV2Metric.Attribution1DRobuxPerUserMigration,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisition7DRevenuePerUserMigration = {
  key: RAQIV2PredefinedTableColumnKey.Acquisition7DRevenuePerUserMigration,
  metric: RAQIV2Metric.Attribution7DRobuxPerUserMigration,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigAcquisition30DRevenuePerUserMigration = {
  key: RAQIV2PredefinedTableColumnKey.Acquisition30DRevenuePerUserMigration,
  metric: RAQIV2Metric.Attribution30DRobuxPerUserMigration,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigShareLinkAcquisitionUsersWithPlays = {
  key: RAQIV2PredefinedTableColumnKey.ShareLinkAcquisitionUsersWithPlays,
  metric: RAQIV2Metric.ShareLinkUniqueUsersWithPlaySessions,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.CampaignName],
    },
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.New],
        },
      ],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigShareLinkAcquisitionQualifiedUsersWithPlays = {
  key: RAQIV2PredefinedTableColumnKey.ShareLinkAcquisitionQualifiedUsersWithPlays,
  metric: RAQIV2Metric.ShareLinkQualifiedUniqueUsersWithPlaySessions,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.CampaignName],
    },
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.New],
        },
      ],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigShareLinkAcquisitionConversionRate = {
  key: RAQIV2PredefinedTableColumnKey.ShareLinkAcquisitionConversionRate,
  metric: RAQIV2Metric.EndToEndCVR,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.CampaignName],
    },
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.New],
        },
      ],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigShareLinkAcquisitionQualifiedConversionRate = {
  key: RAQIV2PredefinedTableColumnKey.ShareLinkAcquisitionQualifiedConversionRate,
  metric: RAQIV2Metric.ShareLinkQualifiedClickCVR,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.CampaignName],
    },
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.New],
        },
      ],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigShareLinkAcquisitionUsersWithDetailPageVisits = {
  key: RAQIV2PredefinedTableColumnKey.ShareLinkAcquisitionUsersWithDetailPageVisits,
  metric: RAQIV2Metric.ShareLinkUniqueUsersWithClicks,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.CampaignName],
    },
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.New],
        },
      ],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigShareLinkAcquisitionD1Retention = {
  key: RAQIV2PredefinedTableColumnKey.ShareLinkAcquisitionD1Retention,
  metric: RAQIV2Metric.ShareLinkAttributionD1RetentionRatio,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.CampaignName],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigShareLinkAcquisitionD7Retention = {
  key: RAQIV2PredefinedTableColumnKey.ShareLinkAcquisitionD7Retention,
  metric: RAQIV2Metric.ShareLinkAttributionD7RetentionRatio,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.CampaignName],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigShareLinkAcquisitionD30Retention = {
  key: RAQIV2PredefinedTableColumnKey.ShareLinkAcquisitionD30Retention,
  metric: RAQIV2Metric.ShareLinkAttributionD30RetentionRatio,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.CampaignName],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigShareLinkAcquisition1DPlaytimePerUser = {
  key: RAQIV2PredefinedTableColumnKey.ShareLinkAcquisition1DPlaytimePerUser,
  metric: RAQIV2Metric.ShareLinkAttribution1DPlaytimePerUserInMinutes,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.CampaignName],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigShareLinkAcquisition7DPlaytimePerUser = {
  key: RAQIV2PredefinedTableColumnKey.ShareLinkAcquisition7DPlaytimePerUser,
  metric: RAQIV2Metric.ShareLinkAttribution7DPlaytimePerUserInMinutes,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.CampaignName],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigShareLinkAcquisition30DPlaytimePerUser = {
  key: RAQIV2PredefinedTableColumnKey.ShareLinkAcquisition30DPlaytimePerUser,
  metric: RAQIV2Metric.ShareLinkAttribution30DPlaytimePerUserInMinutes,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.CampaignName],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigShareLinkAcquisition1DPayerConversion = {
  key: RAQIV2PredefinedTableColumnKey.ShareLinkAcquisition1DPayerConversion,
  metric: RAQIV2Metric.ShareLinkAttribution1DPayerConversionRatio,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.CampaignName],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigShareLinkAcquisition7DPayerConversion = {
  key: RAQIV2PredefinedTableColumnKey.ShareLinkAcquisition7DPayerConversion,
  metric: RAQIV2Metric.ShareLinkAttribution7DPayerConversionRatio,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.CampaignName],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigShareLinkAcquisition30DPayerConversion = {
  key: RAQIV2PredefinedTableColumnKey.ShareLinkAcquisition30DPayerConversion,
  metric: RAQIV2Metric.ShareLinkAttribution30DPayerConversionRatio,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.CampaignName],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigShareLinkAcquisition1DRevenuePerUser = {
  key: RAQIV2PredefinedTableColumnKey.ShareLinkAcquisition1DRevenuePerUser,
  metric: RAQIV2Metric.ShareLinkAttribution1DRobuxPerUser,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.CampaignName],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigShareLinkAcquisition7DRevenuePerUser = {
  key: RAQIV2PredefinedTableColumnKey.ShareLinkAcquisition7DRevenuePerUser,
  metric: RAQIV2Metric.ShareLinkAttribution7DRobuxPerUser,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.CampaignName],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigShareLinkAcquisition30DRevenuePerUser = {
  key: RAQIV2PredefinedTableColumnKey.ShareLinkAcquisition30DRevenuePerUser,
  metric: RAQIV2Metric.ShareLinkAttribution30DRobuxPerUser,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
    breakdown: {
      override: [RAQIV2Dimension.CampaignName],
    },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigTransactionCount = {
  key: RAQIV2PredefinedTableColumnKey.TransactionCount,
  metric: RAQIV2Metric.EconomyTransactionCount,
  overrides: {
    breakdown: {
      override: [
        RAQIV2Dimension.ItemSku,
        RAQIV2Dimension.FlowType,
        RAQIV2Dimension.TransactionType,
      ],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigTransactionCountMigration = {
  key: RAQIV2PredefinedTableColumnKey.TransactionCountMigration,
  metric: RAQIV2Metric.EconomyTransactionCount,
  overrides: {
    breakdown: {
      override: [
        RAQIV2Dimension.ItemSku,
        RAQIV2Dimension.FlowType,
        RAQIV2Dimension.TransactionType,
      ],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigTransactionAmount = {
  key: RAQIV2PredefinedTableColumnKey.TransactionAmount,
  metric: RAQIV2Metric.EconomyTransactionAmount,
  overrides: {
    breakdown: {
      override: [
        RAQIV2Dimension.ItemSku,
        RAQIV2Dimension.FlowType,
        RAQIV2Dimension.TransactionType,
      ],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigTransactionAmountMigration = {
  key: RAQIV2PredefinedTableColumnKey.TransactionAmountMigration,
  metric: RAQIV2Metric.EconomyTransactionAmount,
  overrides: {
    breakdown: {
      override: [
        RAQIV2Dimension.ItemSku,
        RAQIV2Dimension.FlowType,
        RAQIV2Dimension.TransactionType,
      ],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigThumbnailWinningSegments = {
  key: RAQIV2PredefinedTableColumnKey.ThumbnailWinningSegments,
  metric: RAQIV2Metric.ThumbnailWinningSegments,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.ThumbnailAsset],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigThumbnailImpressions = {
  key: RAQIV2PredefinedTableColumnKey.ThumbnailImpressions,
  metric: RAQIV2Metric.ThumbnailImpressions,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.ThumbnailAsset],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigThumbnailQualifiedPlays = {
  key: RAQIV2PredefinedTableColumnKey.ThumbnailQualifiedPlays,
  metric: RAQIV2Metric.ThumbnailQualifiedPlays,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.ThumbnailAsset],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigThumbnailQualifiedPTR = {
  key: RAQIV2PredefinedTableColumnKey.ThumbnailQualifiedPTR,
  metric: RAQIV2Metric.ThumbnailQualifiedPTR,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.ThumbnailAsset],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigThumbnailAVGPlayTime = {
  key: RAQIV2PredefinedTableColumnKey.ThumbnailAVGPlayTime,
  metric: RAQIV2Metric.ThumbnailAverageSessionLengthMinutes,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.ThumbnailAsset],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigUserStepCompletionRateRealtime = {
  key: RAQIV2PredefinedTableColumnKey.UserStepCompletionRateRealtime,
  metric: RAQIV2Metric.UserStepCompletionRateRealtime,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.FunnelStep],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigUserChurnRateRealtime = {
  key: RAQIV2PredefinedTableColumnKey.UserChurnRateRealtime,
  metric: RAQIV2Metric.UserChurnRateRealtime,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.FunnelStep],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigUserTotalConversionRateRealtime = {
  key: RAQIV2PredefinedTableColumnKey.UserTotalConversionRateRealtime,
  metric: RAQIV2Metric.UserTotalConversionRateRealtime,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.FunnelStep],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigFunnelUsersRealtime = {
  key: RAQIV2PredefinedTableColumnKey.FunnelUsersRealtime,
  metric: RAQIV2Metric.FunnelUsersRealtime,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.FunnelStep],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigStepCompletionRateRealtime = {
  key: RAQIV2PredefinedTableColumnKey.StepCompletionRateRealtime,
  metric: RAQIV2Metric.StepCompletionRateRealtime,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.FunnelStep],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigChurnRateRealtime = {
  key: RAQIV2PredefinedTableColumnKey.ChurnRateRealtime,
  metric: RAQIV2Metric.ChurnRateRealtime,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.FunnelStep],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigTotalConversionRateRealtime = {
  key: RAQIV2PredefinedTableColumnKey.TotalConversionRateRealtime,
  metric: RAQIV2Metric.TotalConversionRateRealtime,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.FunnelStep],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigFunnelSessionsRealtime = {
  key: RAQIV2PredefinedTableColumnKey.FunnelSessionsRealtime,
  metric: RAQIV2Metric.FunnelSessionsRealtime,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.FunnelStep],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

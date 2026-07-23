import {
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { TAnalyticsMetricTableColumnConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedTableColumnConfig';
import type { TAnalyticsSerializableTableConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedTableConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

/**
 * Column Configs
 */

export const tableColumnConfigEventRsvpCount = {
  key: 'EventRsvpCount',
  metric: RAQIV2Metric.RSVPCount,
  overrides: {
    breakdown: {
      override: [
        RAQIV2Dimension.VirtualEventId,
        RAQIV2Dimension.EventCategory,
        RAQIV2Dimension.StartTimeUTC,
        RAQIV2Dimension.EndTimeUTC,
      ],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigEventNotificationJoins = {
  key: 'EventNotificationJoins',
  metric: RAQIV2Metric.UsersJoinedFromNotifications,
  overrides: {
    breakdown: {
      override: [
        RAQIV2Dimension.VirtualEventId,
        RAQIV2Dimension.EventCategory,
        RAQIV2Dimension.StartTimeUTC,
        RAQIV2Dimension.EndTimeUTC,
      ],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigEventAvgDailyActiveUsers = {
  key: 'EventAvgDailyActiveUsers',
  metric: RAQIV2Metric.EventAvgDailyActiveUsers,
  overrides: {
    breakdown: {
      override: [
        RAQIV2Dimension.VirtualEventId,
        RAQIV2Dimension.EventCategory,
        RAQIV2Dimension.StartTimeUTC,
        RAQIV2Dimension.EndTimeUTC,
      ],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigEventAvgDailyUserPlaytimeMinutes = {
  key: 'EventAvgDailyUserPlaytimeMinutes',
  metric: RAQIV2Metric.EventAvgDailyUserPlaytimeMinutes,
  overrides: {
    breakdown: {
      override: [
        RAQIV2Dimension.VirtualEventId,
        RAQIV2Dimension.EventCategory,
        RAQIV2Dimension.StartTimeUTC,
        RAQIV2Dimension.EndTimeUTC,
      ],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigEventAvgDailyRevenue = {
  key: 'EventAvgDailyRevenue',
  metric: RAQIV2Metric.EventAvgDailyRevenue,
  overrides: {
    breakdown: {
      override: [
        RAQIV2Dimension.VirtualEventId,
        RAQIV2Dimension.EventCategory,
        RAQIV2Dimension.StartTimeUTC,
        RAQIV2Dimension.EndTimeUTC,
      ],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigEventAvgRevenuePerDailyActiveUser = {
  key: 'EventAvgRevenuePerDailyActiveUser',
  metric: RAQIV2Metric.EventAvgRevenuePerDailyActiveUser,
  overrides: {
    breakdown: {
      override: [
        RAQIV2Dimension.VirtualEventId,
        RAQIV2Dimension.EventCategory,
        RAQIV2Dimension.StartTimeUTC,
        RAQIV2Dimension.EndTimeUTC,
      ],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

/**
 * Table Configs
 */

export const tableConfigExperienceEventHistory = {
  type: AnalyticsComponentType.Table,
  tableKey: 'ExperienceEventsHistory',
  tableConfig: {
    stickyHeader: true,
    stickyFirstColumn: true,
    columnDivider: false,
    defaultActiveSort: RAQIV2Dimension.StartTimeUTC,
  },
  dataColumns: [
    tableColumnConfigEventRsvpCount,
    tableColumnConfigEventNotificationJoins,
    tableColumnConfigEventAvgDailyActiveUsers,
    tableColumnConfigEventAvgDailyUserPlaytimeMinutes,
    tableColumnConfigEventAvgDailyRevenue,
    tableColumnConfigEventAvgRevenuePerDailyActiveUser,
  ],
  breakdowns: [
    RAQIV2Dimension.VirtualEventId,
    RAQIV2Dimension.EventCategory,
    RAQIV2Dimension.StartTimeUTC,
    RAQIV2Dimension.EndTimeUTC,
  ],
  isTotalRowIncluded: false,
  titleKey: translationKey('Title.History', TranslationNamespace.Analytics),
} as const satisfies TAnalyticsSerializableTableConfig;

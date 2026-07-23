import { ChartType } from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ChartStyleMode } from '@rbx/analytics-ui';
import {
  RAQIV2Metric,
  RAQIV2Dimension,
  RAQIV2UIPseudoDimension,
  RAQIV2FlowType,
  RAQIV2MetricGranularity,
  RAQIV2IsNewUser,
  RAQIV2AcquisitionSource,
  RAQIV2UIMetric,
  RAQIV2VoteType,
} from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import RAQIV2SummaryType from '../../enums/RAQIV2SummaryType';
import RAQIV2PredefinedChartKey from '../RAQIV2PredefinedChartKey';
import { ChartConfig } from '../RAQIV2PredefinedChartConfig';

export const chartConfigTotalSourceAndSinkMigration = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.TotalSourceAndSinkMigration,
  titleKey: translationKey('Title.TotalSourcesAndSinks', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.TotalSourcesAndSinks',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.EconomyTransactionAmount,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.TransactionType, RAQIV2Dimension.FlowType],
    },
  },
  chartType: ChartType.Column,
  summarySpec: {
    totalSummaryTypes: [
      {
        type: RAQIV2SummaryType.Average,
        specificLabel: {
          translationKey: translationKey(
            'Label.AverageNetFlowOverSelectedPeriod',
            TranslationNamespace.Analytics,
          ),
        },
      },
    ],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigTopSourcesMigration = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.TopSourcesMigration,
  titleKey: translationKey('Title.TopSources', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey('Description.TopSources', TranslationNamespace.Analytics),
  metric: RAQIV2Metric.EconomyTransactionAmount,
  overrides: {
    breakdown: {
      override: [RAQIV2UIPseudoDimension.TopItemSkus],
    },
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.FlowType,
          values: [RAQIV2FlowType.Source],
        },
      ],
    },
  },
  chartType: ChartType.Column,
  hideTotalSeriesBecauseAllBreakdownsAreUniformlyPositiveOrNegative: true,
} as const satisfies ChartConfig;

export const chartConfigTopSinksMigration = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.TopSinksMigration,
  titleKey: translationKey('Title.TopSinks', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey('Description.TopSinks', TranslationNamespace.Analytics),
  metric: RAQIV2Metric.EconomyTransactionAmount,
  overrides: {
    breakdown: {
      override: [RAQIV2UIPseudoDimension.TopSinksItemSkus],
    },
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.FlowType,
          values: [RAQIV2FlowType.Sink],
        },
      ],
    },
  },
  chartType: ChartType.Column,
  hideTotalSeriesBecauseAllBreakdownsAreUniformlyPositiveOrNegative: true,
} as const satisfies ChartConfig;

export const chartConfigAverageWalletBalanceMigration = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.AverageWalletBalanceMigration,
  titleKey: translationKey('Title.AverageWalletBalance', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.AverageWalletBalance',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.EconomyAverageWalletBalance,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.PayerStatus],
    },
  },
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigAcquisitionNewUsersWithPlays = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.AcquisitionNewUsersWithPlays,
  titleKey: translationKey('Title.NewUsersWithPlaysPerSource', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.NewUsersWithPlaysPerSource',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.UniqueUsersWithPlaySessions,
  overrides: {
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.New],
        },
      ],
    },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
  chartType: ChartType.Column,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
  hideTotalSeriesBecauseAllBreakdownsAreUniformlyPositiveOrNegative: true,
} as const satisfies ChartConfig;

export const chartConfigAcquisitionNewUsersWithImpressions = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.AcquisitionNewUsersWithImpressions,
  titleKey: translationKey(
    'Title.NewUsersWithImpressionsPerSource',
    TranslationNamespace.Analytics,
  ),
  definitionTooltipKey: translationKey(
    'Description.NewUsersWithImpressionsPerSource',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.UniqueUsersWithImpressions,
  overrides: {
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.New],
        },
      ],
    },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
  chartType: ChartType.Column,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
  hideTotalSeriesBecauseAllBreakdownsAreUniformlyPositiveOrNegative: true,
} as const satisfies ChartConfig;

export const chartConfigAcquisitionReturningUsersWithPlays = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.AcquisitionReturningUsersWithPlays,
  titleKey: translationKey(
    'Title.ReturningUsersWithPlaysPerSource',
    TranslationNamespace.Analytics,
  ),
  definitionTooltipKey: translationKey(
    'Description.ReturningUsersWithPlaysPerSource',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.UniqueUsersWithPlaySessions,
  overrides: {
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.Returning],
        },
      ],
    },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
  chartType: ChartType.Column,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
  hideTotalSeriesBecauseAllBreakdownsAreUniformlyPositiveOrNegative: true,
} as const satisfies ChartConfig;

export const chartConfigAcquisitionReturningUsersWithImpressions = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.AcquisitionReturningUsersWithImpressions,
  titleKey: translationKey(
    'Title.ReturningUsersWithImpressionsPerSource',
    TranslationNamespace.Analytics,
  ),
  definitionTooltipKey: translationKey(
    'Description.ReturningUsersWithImpressionsPerSource',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.UniqueUsersWithImpressions,
  overrides: {
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.Returning],
        },
      ],
    },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
  chartType: ChartType.Column,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
  hideTotalSeriesBecauseAllBreakdownsAreUniformlyPositiveOrNegative: true,
} as const satisfies ChartConfig;

export const chartConfigAcquisitionHomeRecommendationQualifiedPTR = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.AcquisitionHomeRecommendationQualifiedPTR,
  titleKey: translationKey('Title.QualifiedPlayThroughRate', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.QualifiedPlayThroughRate',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.QualifiedEndToEndCVR,
  overrides: {
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.AcquisitionSource,
          values: [RAQIV2AcquisitionSource.HomeRecommendation],
        },
      ],
    },
  },
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigAcquisitionHomeRecommendationQualifiedPTRMigration = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.AcquisitionHomeRecommendationQualifiedPTRMigration,
  titleKey: translationKey('Title.QualifiedPlayThroughRate', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.QualifiedPlayThroughRate',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.QualifiedEndToEndCVRMigration,
  overrides: {
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.AcquisitionSource,
          values: [RAQIV2AcquisitionSource.HomeRecommendation],
        },
      ],
    },
  },
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigD1Retention = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.D1Retention,
  titleKey: translationKey('Title.D1Retention', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey('Description.D1Retention', TranslationNamespace.Analytics), // reused for metric
  metric: RAQIV2Metric.D1Retention,
  chartType: ChartType.Spline,
  overrides: {},
} as const satisfies ChartConfig;

export const chartConfigForwardD1Retention = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.ForwardD1Retention,
  titleKey: translationKey('Title.ForwardD1Retention', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.ForwardD1Retention',
    TranslationNamespace.Analytics,
  ), // reused for metric
  metric: RAQIV2Metric.ForwardD1Retention,
  chartType: ChartType.Spline,
  overrides: {},
} as const satisfies ChartConfig;

export const chartConfigL7AverageForwardD1Retention = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.L7AverageForwardD1Retention', TranslationNamespace.Analytics),
  titleKeyByContext: {
    scorecard: translationKey(
      'Title.L7AverageForwardD1Retention.Scorecard',
      TranslationNamespace.Analytics,
    ),
  },
  definitionTooltipKey: translationKey(
    'Description.L7AverageForwardD1Retention',
    TranslationNamespace.Analytics,
  ), // reused for metric
  metric: RAQIV2Metric.L7AverageForwardD1Retention,
  chartType: ChartType.Spline,
  overrides: {},
} as const satisfies ChartConfig;

export const chartConfigForwardD1RetentionByTopAcquisitionSources = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.ForwardD1Retention', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.ForwardD1Retention',
    TranslationNamespace.Analytics,
  ), // reused for metric
  metric: RAQIV2Metric.ForwardD1Retention,
  chartType: ChartType.Spline,
  overrides: {
    breakdown: {
      override: [RAQIV2UIPseudoDimension.TopAcquisitionSources],
    },
  },
} as const satisfies ChartConfig;

export const chartConfigL7AverageForwardD1RetentionByTopAcquisitionSources = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.L7AverageForwardD1Retention', TranslationNamespace.Analytics),
  titleKeyByContext: {
    scorecard: translationKey(
      'Title.L7AverageForwardD1Retention.Scorecard',
      TranslationNamespace.Analytics,
    ),
  },
  definitionTooltipKey: translationKey(
    'Description.L7AverageForwardD1Retention',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.L7AverageForwardD1Retention,
  chartType: ChartType.Spline,
  overrides: {
    breakdown: {
      override: [RAQIV2UIPseudoDimension.TopAcquisitionSources],
    },
  },
} as const satisfies ChartConfig;

export const chartConfigD7Retention = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.D7Retention,
  titleKey: translationKey('Title.D7Retention', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey('Description.D7Retention', TranslationNamespace.Analytics), // reused for metric
  metric: RAQIV2Metric.D7Retention,
  chartType: ChartType.Spline,
  overrides: {},
} as const satisfies ChartConfig;

export const chartConfigForwardD7Retention = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.ForwardD7Retention,
  titleKey: translationKey('Title.ForwardD7Retention', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.ForwardD7Retention',
    TranslationNamespace.Analytics,
  ), // reused for metric
  metric: RAQIV2Metric.ForwardD7Retention,
  chartType: ChartType.Spline,
  overrides: {},
} as const satisfies ChartConfig;

export const chartConfigL7AverageForwardD7Retention = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.L7AverageForwardD7Retention', TranslationNamespace.Analytics),
  titleKeyByContext: {
    scorecard: translationKey(
      'Title.L7AverageForwardD7Retention.Scorecard',
      TranslationNamespace.Analytics,
    ),
  },
  definitionTooltipKey: translationKey(
    'Description.L7AverageForwardD7Retention',
    TranslationNamespace.Analytics,
  ), // reused for metric
  metric: RAQIV2Metric.L7AverageForwardD7Retention,
  chartType: ChartType.Spline,
  overrides: {},
} as const satisfies ChartConfig;

export const chartConfigD30Retention = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.D30Retention,
  titleKey: translationKey('Title.D30Retention', TranslationNamespace.Analytics), // reused for metric
  definitionTooltipKey: translationKey('Description.D30Retention', TranslationNamespace.Analytics),
  metric: RAQIV2Metric.D30Retention,
  chartType: ChartType.Spline,
  overrides: {},
} as const satisfies ChartConfig;

export const chartConfigForwardD30Retention = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.ForwardD30Retention,
  titleKey: translationKey('Title.ForwardD30Retention', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.ForwardD30Retention',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.ForwardD30Retention,
  chartType: ChartType.Spline,
  overrides: {},
} as const satisfies ChartConfig;

export const chartConfigD1Stickiness = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.D1Stickiness,
  titleKey: translationKey('Title.D1Stickiness', TranslationNamespace.Analytics), // reused for metric
  definitionTooltipKey: translationKey('Description.D1Stickiness', TranslationNamespace.Analytics),
  metric: RAQIV2Metric.D1Stickiness,
  chartType: ChartType.Spline,
  overrides: {},
} as const satisfies ChartConfig;

export const chartConfigD7Stickiness = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.D7Stickiness,
  titleKey: translationKey('Title.D7Stickiness', TranslationNamespace.Analytics), // reused for metric
  definitionTooltipKey: translationKey('Description.D7Stickiness', TranslationNamespace.Analytics),
  metric: RAQIV2Metric.D7Stickiness,
  chartType: ChartType.Spline,
  overrides: {},
} as const satisfies ChartConfig;

export const chartConfigD30Stickiness = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.D30Stickiness,
  titleKey: translationKey('Title.D30Stickiness', TranslationNamespace.Analytics), // reused for metric
  definitionTooltipKey: translationKey('Description.D30Stickiness', TranslationNamespace.Analytics),
  metric: RAQIV2Metric.D30Stickiness,
  chartType: ChartType.Spline,
  overrides: {},
} as const satisfies ChartConfig;

export const chartConfigDauMauStickiness = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.DauMauStickiness,
  titleKey: translationKey('Title.DauMauStickiness', TranslationNamespace.Analytics), // reused for metric
  definitionTooltipKey: translationKey(
    'Description.DauMauStickiness',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.DauMauStickiness,
  chartType: ChartType.Spline,
  overrides: {},
} as const satisfies ChartConfig;

export const chartConfigDailyActiveUsers = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.DailyActiveUsers,
  titleKey: translationKey('Title.DAU', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey('Description.DAU', TranslationNamespace.Analytics), // reused for metric
  metric: RAQIV2Metric.DailyActiveUsers,
  chartType: ChartType.Spline,
  overrides: {},
  titleKeyByGranularity: {
    [RAQIV2MetricGranularity.OneWeek]: translationKey(
      'Title.DAU.Weekly',
      TranslationNamespace.Analytics,
    ),
    [RAQIV2MetricGranularity.OneMonth]: translationKey(
      'Title.DAU.Monthly',
      TranslationNamespace.Analytics,
    ),
  },
  definitionTooltipKeyByGranularity: {
    [RAQIV2MetricGranularity.OneWeek]: translationKey(
      'Description.DAU.Weekly',
      TranslationNamespace.Analytics,
    ),
    [RAQIV2MetricGranularity.OneMonth]: translationKey(
      'Description.DAU.Monthly',
      TranslationNamespace.Analytics,
    ),
  },
} as const satisfies ChartConfig;

export const chartConfigL7AverageDailyActiveUsers = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.L7AverageDailyActiveUsers', TranslationNamespace.Analytics),
  titleKeyByContext: {
    scorecard: translationKey(
      'Title.L7AverageDailyActiveUsers.Scorecard',
      TranslationNamespace.Analytics,
    ),
  },
  definitionTooltipKey: translationKey(
    'Description.L7AverageDailyActiveUsers',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.L7AverageDailyActiveUsers,
  chartType: ChartType.Spline,
  overrides: {},
} as const satisfies ChartConfig;

export const chartConfigMonthlyActiveUsers = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.MonthlyActiveUsers,
  titleKey: translationKey('Title.MAU', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey('Description.MAU', TranslationNamespace.Analytics), // reused for metric
  metric: RAQIV2Metric.MonthlyActiveUsers,
  chartType: ChartType.Spline,
  overrides: {},
} as const satisfies ChartConfig;

export const chartConfigEngagementNewUsers = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.EngagementNewUsers,
  titleKey: translationKey('Title.NewUsers', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey('Description.NewUsers', TranslationNamespace.Analytics),
  metric: RAQIV2Metric.DailyActiveUsers,
  overrides: {
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.New],
        },
      ],
    },
  },
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const chartConfigEngagementReturningUsers = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.EngagementReturningUsers,
  titleKey: translationKey('Title.ReturningUsers', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.ReturningUsers',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.DailyActiveUsers,
  overrides: {
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.Returning],
        },
      ],
    },
  },
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const chartConfigEngagementNewUsersSessionTime = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.EngagementNewUsersSessionTime,
  titleKey: translationKey('Title.NewUsersSessionTime', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.NewUsersSessionTime',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.AverageSessionLengthMinutes,
  overrides: {
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.New],
        },
      ],
    },
  },
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const chartConfigEngagementReturningUsersSessionTime = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.EngagementReturningUsersSessionTime,
  titleKey: translationKey('Title.ReturningUsersSessionTime', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.ReturningUsersSessionTime',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.AverageSessionLengthMinutes,
  overrides: {
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.Returning],
        },
      ],
    },
  },
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const chartConfigEngagementTotalPlayTime = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.EngagementTotalPlayTime,
  titleKey: translationKey('Title.TotalPlaytime', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey('Description.TotalPlayTime', TranslationNamespace.Analytics), // reused for metric
  metric: RAQIV2Metric.TotalPlayTimeHours,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const chartConfigEngagementSessions = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.EngagementSessions,
  titleKey: translationKey('Title.Visits', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey('Description.Visits', TranslationNamespace.Analytics), // reused for metric
  metric: RAQIV2Metric.Visits,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const chartConfigEngagementAverageSessionTime = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.EngagementAverageSessionTime,
  titleKey: translationKey('Title.AveragePlayTime', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.AveragePlayTime',
    TranslationNamespace.Analytics,
  ), // reused for metric
  metric: RAQIV2Metric.AverageSessionLengthMinutes,
  overrides: {},
  chartType: ChartType.Spline,
  definitionTooltipKeyByGranularity: {
    [RAQIV2MetricGranularity.OneWeek]: translationKey(
      'Description.AveragePlayTime.Weekly',
      TranslationNamespace.Analytics,
    ),
    [RAQIV2MetricGranularity.OneMonth]: translationKey(
      'Description.AveragePlayTime.Monthly',
      TranslationNamespace.Analytics,
    ),
  },
} as const satisfies ChartConfig;

export const chartConfigEngagementAveragePlayTimePerDAU = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.EngagementAveragePlayTimePerDAU,
  titleKey: translationKey('Title.AveragePlayTimePerDAU', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.AveragePlayTimePerDAU',
    TranslationNamespace.Analytics,
  ), // reused for metric
  metric: RAQIV2Metric.AveragePlayTimeMinutesPerDAU,
  overrides: {},
  chartType: ChartType.Spline,
  titleKeyByGranularity: {
    [RAQIV2MetricGranularity.OneWeek]: translationKey(
      'Title.AveragePlayTimePerDAU.Weekly',
      TranslationNamespace.Analytics,
    ),
    [RAQIV2MetricGranularity.OneMonth]: translationKey(
      'Title.AveragePlayTimePerDAU.Monthly',
      TranslationNamespace.Analytics,
    ),
  },
  definitionTooltipKeyByGranularity: {
    [RAQIV2MetricGranularity.OneWeek]: translationKey(
      'Description.AveragePlayTimePerDAU.Weekly',
      TranslationNamespace.Analytics,
    ),
    [RAQIV2MetricGranularity.OneMonth]: translationKey(
      'Description.AveragePlayTimePerDAU.Monthly',
      TranslationNamespace.Analytics,
    ),
  },
} as const satisfies ChartConfig;

export const chartConfigL7AveragePlayTimePerDAU = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.L7AveragePlayTimePerDAU', TranslationNamespace.Analytics),
  titleKeyByContext: {
    scorecard: translationKey(
      'Title.L7AveragePlayTimePerDAU.Scorecard',
      TranslationNamespace.Analytics,
    ),
  },
  definitionTooltipKey: translationKey(
    'Description.L7AveragePlayTimePerDAU',
    TranslationNamespace.Analytics,
  ), // reused for metric
  metric: RAQIV2Metric.L7AveragePlayTimeMinutesPerDAU,
  overrides: {},
  chartType: ChartType.Spline,
  titleKeyByGranularity: {
    [RAQIV2MetricGranularity.OneWeek]: translationKey(
      'Title.L7AveragePlayTimePerDAU.Weekly',
      TranslationNamespace.Analytics,
    ),
    [RAQIV2MetricGranularity.OneMonth]: translationKey(
      'Title.L7AveragePlayTimePerDAU.Monthly',
      TranslationNamespace.Analytics,
    ),
  },
  definitionTooltipKeyByGranularity: {
    [RAQIV2MetricGranularity.OneWeek]: translationKey(
      'Description.L7AveragePlayTimePerDAU.Weekly',
      TranslationNamespace.Analytics,
    ),
    [RAQIV2MetricGranularity.OneMonth]: translationKey(
      'Description.L7AveragePlayTimePerDAU.Monthly',
      TranslationNamespace.Analytics,
    ),
  },
} as const satisfies ChartConfig;

export const chartConfigEngagementNewUserSessionTimeRetention = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.EngagementNewUserSessionTimeRetention,
  titleKey: translationKey('Title.NewUserSessionTimeRetention', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.NewUserSessionTimeRetention',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.TotalSessionsEndedInBucket,
  overrides: {
    breakdown: {
      intersect: [RAQIV2Dimension.SessionTimeBucket],
    },
    granularity: {
      override: RAQIV2MetricGranularity.None,
    },
  },
  chartType: ChartType.DurationSpline,
} as const satisfies ChartConfig;

export const chartConfigDailyRevenue = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.DailyRevenue,
  titleKey: translationKey('Title.Robux', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey('Description.Robux', TranslationNamespace.Analytics), // reused for metric
  metric: RAQIV2Metric.DailyRevenue,
  overrides: {},
  chartType: ChartType.Spline,
  titleKeyByGranularity: {
    [RAQIV2MetricGranularity.OneWeek]: translationKey(
      'Title.Robux.Weekly',
      TranslationNamespace.Analytics,
    ),
    [RAQIV2MetricGranularity.OneMonth]: translationKey(
      'Title.Robux.Monthly',
      TranslationNamespace.Analytics,
    ),
  },
  definitionTooltipKeyByGranularity: {
    [RAQIV2MetricGranularity.OneWeek]: translationKey(
      'Description.Robux.Weekly',
      TranslationNamespace.Analytics,
    ),
    [RAQIV2MetricGranularity.OneMonth]: translationKey(
      'Description.Robux.Monthly',
      TranslationNamespace.Analytics,
    ),
  },
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }, { type: RAQIV2SummaryType.Total }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigL7AverageDailyRevenue = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.L7AverageDailyRevenue', TranslationNamespace.Analytics),
  titleKeyByContext: {
    scorecard: translationKey(
      'Title.L7AverageDailyRevenue.Scorecard',
      TranslationNamespace.Analytics,
    ),
  },
  definitionTooltipKey: translationKey(
    'Description.L7AverageDailyRevenue',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.L7AverageDailyRevenue,
  overrides: {},
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }, { type: RAQIV2SummaryType.Total }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigPayingUsers = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.PayingUsers,
  titleKey: translationKey('Title.PayingUsers', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey('Description.PayingUsers', TranslationNamespace.Analytics), // reused for metric
  metric: RAQIV2Metric.PayingUsers,
  overrides: {},
  chartType: ChartType.Spline,
  definitionTooltipKeyByGranularity: {
    [RAQIV2MetricGranularity.OneWeek]: translationKey(
      'Description.PayingUsers.Weekly',
      TranslationNamespace.Analytics,
    ),
    [RAQIV2MetricGranularity.OneMonth]: translationKey(
      'Description.PayingUsers.Monthly',
      TranslationNamespace.Analytics,
    ),
  },
} as const satisfies ChartConfig;

export const chartConfigDailyRevenueBySource = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.DailyRevenueBySource,
  titleKey: translationKey('Title.RevenueSource', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey('Description.RevenueSource', TranslationNamespace.Analytics), // reused for metric
  metric: RAQIV2Metric.DailyRevenue,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.RevenueSource],
    },
  },
  chartType: ChartType.Spline,
  definitionTooltipKeyByGranularity: {
    [RAQIV2MetricGranularity.OneWeek]: translationKey(
      'Description.RevenueSource.Weekly',
      TranslationNamespace.Analytics,
    ),
    [RAQIV2MetricGranularity.OneMonth]: translationKey(
      'Description.RevenueSource.Monthly',
      TranslationNamespace.Analytics,
    ),
  },
  summarySpec: {
    totalSummaryTypes: [],
    perBreakdownSummaryTypes: [{ type: RAQIV2SummaryType.Total }],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigAverageRevenuePerDailyActiveUser = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.AverageRevenuePerDailyActiveUser,
  titleKey: translationKey('Title.ARPU', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey('Description.ARPU', TranslationNamespace.Analytics), // reused for metric
  metric: RAQIV2Metric.AverageRevenuePerUser,
  overrides: {},
  chartType: ChartType.Spline,
  titleKeyByGranularity: {
    [RAQIV2MetricGranularity.OneWeek]: translationKey(
      'Title.ARPU.Weekly',
      TranslationNamespace.Analytics,
    ),
    [RAQIV2MetricGranularity.OneMonth]: translationKey(
      'Title.ARPU.Monthly',
      TranslationNamespace.Analytics,
    ),
  },
  definitionTooltipKeyByGranularity: {
    [RAQIV2MetricGranularity.OneWeek]: translationKey(
      'Description.ARPU.Weekly',
      TranslationNamespace.Analytics,
    ),
    [RAQIV2MetricGranularity.OneMonth]: translationKey(
      'Description.ARPU.Monthly',
      TranslationNamespace.Analytics,
    ),
  },
} as const satisfies ChartConfig;

export const chartConfigAverageRevenuePerPayingUser = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.AverageRevenuePerPayingUser,
  titleKey: translationKey('Title.ARPPU', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey('Description.ARPPU', TranslationNamespace.Analytics), // reused for metric
  metric: RAQIV2Metric.AverageRevenuePerPayingUser,
  overrides: {},
  chartType: ChartType.Spline,
  definitionTooltipKeyByGranularity: {
    [RAQIV2MetricGranularity.OneWeek]: translationKey(
      'Description.ARPPU.Weekly',
      TranslationNamespace.Analytics,
    ),
    [RAQIV2MetricGranularity.OneMonth]: translationKey(
      'Description.ARPPU.Monthly',
      TranslationNamespace.Analytics,
    ),
  },
} as const satisfies ChartConfig;

export const chartConfigL7AverageRevenuePerPayingUser = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.L7AverageRevenuePerPayingUser', TranslationNamespace.Analytics),
  titleKeyByContext: {
    scorecard: translationKey(
      'Title.L7AverageRevenuePerPayingUser.Scorecard',
      TranslationNamespace.Analytics,
    ),
  },
  definitionTooltipKey: translationKey(
    'Description.L7AverageRevenuePerPayingUser',
    TranslationNamespace.Analytics,
  ), // reused for metric
  metric: RAQIV2Metric.L7AverageRevenuePerPayingUser,
  overrides: {},
  chartType: ChartType.Spline,
  definitionTooltipKeyByGranularity: {
    [RAQIV2MetricGranularity.OneWeek]: translationKey(
      'Description.L7AverageRevenuePerPayingUser.Weekly',
      TranslationNamespace.Analytics,
    ),
    [RAQIV2MetricGranularity.OneMonth]: translationKey(
      'Description.L7AverageRevenuePerPayingUser.Monthly',
      TranslationNamespace.Analytics,
    ),
  },
} as const satisfies ChartConfig;

export const chartConfigConversionRate = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.ConversionRate,
  titleKey: translationKey('Title.ConversionRate', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.ConversionRate',
    TranslationNamespace.Analytics,
  ), // reused for metric
  metric: RAQIV2Metric.PayingUsersCVR,
  overrides: {},
  chartType: ChartType.Spline,
  definitionTooltipKeyByGranularity: {
    [RAQIV2MetricGranularity.OneWeek]: translationKey(
      'Description.ConversionRate.Weekly',
      TranslationNamespace.Analytics,
    ),
    [RAQIV2MetricGranularity.OneMonth]: translationKey(
      'Description.ConversionRate.Monthly',
      TranslationNamespace.Analytics,
    ),
  },
} as const satisfies ChartConfig;

export const chartConfigL7AveragePayingUsersCVR = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.L7AveragePayingUsersCVR', TranslationNamespace.Analytics),
  titleKeyByContext: {
    scorecard: translationKey(
      'Title.L7AveragePayingUsersCVR.Scorecard',
      TranslationNamespace.Analytics,
    ),
  },
  definitionTooltipKey: translationKey(
    'Description.L7AveragePayingUsersCVR',
    TranslationNamespace.Analytics,
  ), // reused for metric
  metric: RAQIV2Metric.L7AveragePayingUsersCVR,
  overrides: {},
  chartType: ChartType.Spline,
  definitionTooltipKeyByGranularity: {
    [RAQIV2MetricGranularity.OneWeek]: translationKey(
      'Description.L7AveragePayingUsersCVR.Weekly',
      TranslationNamespace.Analytics,
    ),
    [RAQIV2MetricGranularity.OneMonth]: translationKey(
      'Description.L7AveragePayingUsersCVR.Monthly',
      TranslationNamespace.Analytics,
    ),
  },
} as const satisfies ChartConfig;

export const chartConfigAcquisitionNewUsersWithPlaysV2 = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.AcquisitionNewUsersWithPlaysV2,
  titleKey: translationKey('Title.NewUsersWithPlaysPerSource', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.NewUsersWithPlaysPerSource',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.UniqueUsersWithPlaySessions,
  overrides: {
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.New],
        },
      ],
    },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigL7AverageAcquisitionNewUsersWithPlaysV2 = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey(
    'Title.L7AverageNewUsersWithPlaysPerSource',
    TranslationNamespace.Analytics,
  ),
  definitionTooltipKey: translationKey(
    'Description.L7AverageNewUsersWithPlaysPerSource',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.L7AverageUniqueUsersWithPlaySessions,
  overrides: {
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.New],
        },
      ],
    },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigAcquisitionNewUsersWithImpressionsV2 = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.AcquisitionNewUsersWithImpressionsV2,
  titleKey: translationKey(
    'Title.NewUsersWithImpressionsPerSource',
    TranslationNamespace.Analytics,
  ),
  definitionTooltipKey: translationKey(
    'Description.NewUsersWithImpressionsPerSource',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.UniqueUsersWithImpressions,
  overrides: {
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.New],
        },
      ],
    },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigAcquisitionReturningUsersWithPlaysV2 = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.AcquisitionReturningUsersWithPlaysV2,
  titleKey: translationKey(
    'Title.ReturningUsersWithPlaysPerSource',
    TranslationNamespace.Analytics,
  ),
  definitionTooltipKey: translationKey(
    'Description.ReturningUsersWithPlaysPerSource',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.UniqueUsersWithPlaySessions,
  overrides: {
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.Returning],
        },
      ],
    },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigAcquisitionReturningUsersWithImpressionsV2 = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.AcquisitionReturningUsersWithImpressionsV2,
  titleKey: translationKey(
    'Title.ReturningUsersWithImpressionsPerSource',
    TranslationNamespace.Analytics,
  ),
  definitionTooltipKey: translationKey(
    'Description.ReturningUsersWithImpressionsPerSource',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.UniqueUsersWithImpressions,
  overrides: {
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.Returning],
        },
      ],
    },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigAcquisitionNewUsersWithPlaysV2Migration = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.AcquisitionNewUsersWithPlaysV2Migration,
  titleKey: translationKey('Title.NewUsersWithPlaysPerSource', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.NewUsersWithPlaysPerSource',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.UniqueUsersWithPlaySessionsMigration,
  overrides: {
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.New],
        },
      ],
    },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigAcquisitionNewUsersWithImpressionsV2Migration = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.AcquisitionNewUsersWithImpressionsV2Migration,
  titleKey: translationKey(
    'Title.NewUsersWithImpressionsPerSource',
    TranslationNamespace.Analytics,
  ),
  definitionTooltipKey: translationKey(
    'Description.NewUsersWithImpressionsPerSource',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.UniqueUsersWithImpressionsMigration,
  overrides: {
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.New],
        },
      ],
    },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigAcquisitionReturningUsersWithPlaysV2Migration = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.AcquisitionReturningUsersWithPlaysV2Migration,
  titleKey: translationKey(
    'Title.ReturningUsersWithPlaysPerSource',
    TranslationNamespace.Analytics,
  ),
  definitionTooltipKey: translationKey(
    'Description.ReturningUsersWithPlaysPerSource',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.UniqueUsersWithPlaySessionsMigration,
  overrides: {
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.Returning],
        },
      ],
    },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigAcquisitionReturningUsersWithImpressionsV2Migration = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.AcquisitionReturningUsersWithImpressionsV2Migration,
  titleKey: translationKey(
    'Title.ReturningUsersWithImpressionsPerSource',
    TranslationNamespace.Analytics,
  ),
  definitionTooltipKey: translationKey(
    'Description.ReturningUsersWithImpressionsPerSource',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.UniqueUsersWithImpressionsMigration,
  overrides: {
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.Returning],
        },
      ],
    },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
  },
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigTopSourcesByNewUsersWithPlays = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.TopSourcesByNewUsersWithPlays,
  titleKey: translationKey('Title.TopSourcesByNewUsersWithPlays', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.TopSourcesByNewUsersWithPlays',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.UniqueUsersWithPlaySessions,
  overrides: {
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.New],
        },
      ],
    },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
  chartType: ChartType.Bar,
  chartHeight: 230,
  sort: {
    byBreakdownTotal: true,
  },
  breakdownLimit: 5,
} as const satisfies ChartConfig;

export const chartConfigTopSourcesByNewUsersWithPlaysMigration = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.TopSourcesByNewUsersWithPlaysMigration,
  titleKey: translationKey('Title.TopSourcesByNewUsersWithPlays', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.TopSourcesByNewUsersWithPlays',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.UniqueUsersWithPlaySessionsMigration,
  overrides: {
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.IsNewUser,
          values: [RAQIV2IsNewUser.New],
        },
      ],
    },
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
  chartType: ChartType.Bar,
  chartHeight: 230,
  sort: {
    byBreakdownTotal: true,
  },
  breakdownLimit: 5,
} as const satisfies ChartConfig;

export const chartConfigTopSourcesBy30DRevenuePerUser = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.TopSourcesBy30DRevenuePerUser,
  titleKey: translationKey('Title.TopSourcesBy30DRevenuePerUser', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.TopSourcesBy30DRevenuePerUser',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.Attribution30DRobuxPerUser,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
  chartType: ChartType.Bar,
  chartHeight: 230,
  sort: {
    byBreakdownTotal: true,
  },
  breakdownLimit: 5,
} as const satisfies ChartConfig;

export const chartConfigTopSourcesBy30DRevenuePerUserMigration = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.TopSourcesBy30DRevenuePerUserMigration,
  titleKey: translationKey('Title.TopSourcesBy30DRevenuePerUser', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.TopSourcesBy30DRevenuePerUser',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.Attribution30DRobuxPerUserMigration,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.AcquisitionSource],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
  chartType: ChartType.Bar,
  chartHeight: 230,
  sort: {
    byBreakdownTotal: true,
  },
  breakdownLimit: 5,
} as const satisfies ChartConfig;

export const chartConfigPerformanceClientFps = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.PerformanceClientFps,
  titleKey: translationKey('Title.ClientFps', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey('Description.ClientFps', TranslationNamespace.Analytics), // reused for metric
  metric: RAQIV2UIMetric.ClientFps,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const chartConfigPerformanceClientMemoryUsage = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.PerformanceClientMemoryUsage,
  titleKey: translationKey('Title.ClientMemoryUtilizationBytes', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.ClientMemoryUtilizationBytes',
    TranslationNamespace.Analytics,
  ), // reused for metric
  metric: RAQIV2UIMetric.ClientMemoryUsage,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const chartConfigPerformanceClientMemoryUsagePercentage = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.PerformanceClientMemoryUsagePercentage,
  titleKey: translationKey('Title.ClientMemoryUtilizationRatio', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.ClientMemoryUtilizationRatio',
    TranslationNamespace.Analytics,
  ), // reused for metric
  metric: RAQIV2UIMetric.ClientMemoryUsagePercentage,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const chartConfigPerformanceClientCrashRate = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.PerformanceClientCrashRate,
  titleKey: translationKey('Title.ClientCrashRate', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.ClientCrashRate',
    TranslationNamespace.Analytics,
  ), // reused for metric
  metric: RAQIV2Metric.ClientCrashRate15m,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const chartConfigPerformanceClientOomUnexpectedExits = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Label.Metric.OomUnexpectedExits', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.OomUnexpectedExits',
    TranslationNamespace.Analytics,
  ),
  chartType: ChartType.Spline,
  metric: RAQIV2Metric.OomUnexpectedExits,
  overrides: {},
} as const satisfies ChartConfig;

export const chartConfigClientCPUTime = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Label.Metric.ClientCpuTime', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey('Description.ClientCpuTime', TranslationNamespace.Analytics),
  chartType: ChartType.Area,
  metric: RAQIV2Metric.ClientCpuTimeAvg,
  overrides: {},
  summarySpec: {
    totalSummaryTypes: [
      {
        type: RAQIV2SummaryType.Average,
        specificLabel: {
          translationKey: translationKey(
            'Label.AverageTotalPerMinSelectedPeriod',
            TranslationNamespace.Analytics,
          ),
        },
      },
    ],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigPerformanceSessionTime = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.PerformanceSessionTime,
  titleKey: translationKey('Title.PerformanceSessionTime', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.PerformanceSessionTime',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2UIMetric.SessionDurationSeconds,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const chartConfigPerformancePeakConcurrentPlayers = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.PerformanceConcurrentPlayers,
  titleKey: translationKey('Label.Metric.PeakConcurrentPlayers', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.PeakConcurrentPlayers',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.PeakConcurrentPlayers,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const chartConfigPerformanceServerFps = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.PerformanceServerFps,
  titleKey: translationKey('Title.ServerFrameRate', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.ServerFrameRate',
    TranslationNamespace.Analytics,
  ), // reused for metric
  metric: RAQIV2UIMetric.ServerFrameRate,
  overrides: {
    breakdown: {
      override: [RAQIV2UIPseudoDimension.PercentileType],
    },
  },
  summarySpec: {
    totalSummaryTypes: [],
    perBreakdownSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    aggregatedBreakdownSummaryTypes: [],
  },
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const chartConfigPerformanceServerFpsV2 = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.PerformanceServerFpsV2,
  titleKey: translationKey('Title.ServerFrameRate', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.ServerFrameRate',
    TranslationNamespace.Analytics,
  ), // reused for metric
  metric: RAQIV2UIMetric.ServerFrameRate,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const chartConfigPerformanceServerCpuEfficiency = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.PerformanceServerCpuEfficiency,
  titleKey: translationKey('Title.ServerCpuEfficiencyScore', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.ServerCpuEfficiencyScore',
    TranslationNamespace.Analytics,
  ), // reused for metric
  metric: RAQIV2Metric.ComputeEfficiency,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const chartConfigPerformanceServerMemoryUsage = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.PerformanceServerMemoryUsage,
  titleKey: translationKey('Title.ServerMemory', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.ServerMemoryUsage',
    TranslationNamespace.Analytics,
  ), // reused for metric
  metric: RAQIV2UIMetric.ServerMemoryUsage,
  overrides: {
    breakdown: {
      override: [RAQIV2UIPseudoDimension.PercentileType],
    },
  },
  summarySpec: {
    totalSummaryTypes: [],
    perBreakdownSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    aggregatedBreakdownSummaryTypes: [],
  },
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const chartConfigPerformanceServerCpuUsage = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.PerformanceServerCpuUsage,
  titleKey: translationKey('Title.ServerCpuUsage', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.ServerCpuUsage',
    TranslationNamespace.Analytics,
  ), // reused for metric
  metric: RAQIV2UIMetric.CoresPerServer,
  overrides: {
    breakdown: {
      override: [RAQIV2UIPseudoDimension.PercentileType],
    },
  },
  summarySpec: {
    totalSummaryTypes: [],
    perBreakdownSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    aggregatedBreakdownSummaryTypes: [],
  },
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const chartConfigPerformanceServerCpuUsageV2 = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.PerformanceServerCpuUsageV2,
  titleKey: translationKey('Title.ServerCpuUsage', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.ServerCpuUsage',
    TranslationNamespace.Analytics,
  ), // reused for metric
  metric: RAQIV2UIMetric.CoresPerServer,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const chartConfigOverviewMiniConcurrentPlayers = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.OverviewMiniConcurrentPlayers,
  titleKey: translationKey('title.ConcurrentUsers', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.ConcurrentUsers',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.ConcurrentPlayers,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.OneHour },
  },
  chartType: ChartType.Spline,
  chartStyleMode: ChartStyleMode.Minimal,
} as const satisfies ChartConfig;

export const chartConfigPerformanceServerCpuTimeV2 = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.PerformanceServerCpuTimeV2,
  titleKey: translationKey('Title.PerformanceServerCpuTime', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.PerformanceServerCpuTime',
    TranslationNamespace.Analytics,
  ),
  summarySpec: {
    totalSummaryTypes: [
      {
        type: RAQIV2SummaryType.Average,
        specificLabel: {
          translationKey: translationKey(
            'Label.AverageTotalPerMinSelectedPeriod',
            TranslationNamespace.Analytics,
          ),
        },
      },
    ],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
  metric: RAQIV2UIMetric.ServerCpuTime,
  overrides: {},
  chartType: ChartType.Area,
} as const satisfies ChartConfig;

export const chartConfigPerformanceServerMemoryUsageV2 = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.PerformanceServerMemoryUsageV2,
  titleKey: translationKey('Title.PerformanceServerMemoryUsageV2', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.PerformanceServerMemoryUsageV2',
    TranslationNamespace.Analytics,
  ),
  summarySpec: {
    totalSummaryTypes: [
      {
        type: RAQIV2SummaryType.Average,
        specificLabel: {
          translationKey: translationKey(
            'Label.AverageTotalSelectedPeriod',
            TranslationNamespace.Analytics,
          ),
        },
      },
    ],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
  metric: RAQIV2UIMetric.ServerMemoryUsageV2,
  overrides: {},
  chartType: ChartType.Area,
} as const satisfies ChartConfig;

export const chartConfigPerformanceServerMemoryUsageByAge = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.PerformanceServerMemoryUsageByAge,
  titleKey: translationKey(
    'Title.PerformanceServerMemoryUsageByAge',
    TranslationNamespace.Analytics,
  ),
  definitionTooltipKey: translationKey(
    'Description.PerformanceServerMemoryUsageByAge',
    TranslationNamespace.Analytics,
  ),
  summarySpec: {
    totalSummaryTypes: [
      {
        type: RAQIV2SummaryType.GrowthRate,
        specificLabel: {
          translationKey: translationKey(
            'Label.PercentageGrowthOverServerLifecycle',
            TranslationNamespace.Analytics,
          ),
        },
      },
    ],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
  metric: RAQIV2UIMetric.ServerMemoryUsageByServerAge,
  overrides: {
    breakdown: {
      intersect: [RAQIV2Dimension.ServerAgeBucket],
    },
    granularity: {
      override: RAQIV2MetricGranularity.None,
    },
  },
  chartType: ChartType.DurationArea,
} as const satisfies ChartConfig;

export const chartConfigCustomEventsMigration = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.CustomEventsMigration,
  titleKey: translationKey('Title.CustomEvent', TranslationNamespace.Analytics),
  metric: RAQIV2UIMetric.CustomEventsV2,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const chartConfigThumbnailQualifiedPTR = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.ThumbnailQualifiedPTR,
  titleKey: translationKey('Label.Metric.ThumbnailQualifiedPTR', TranslationNamespace.Analytics),
  metric: RAQIV2Metric.ThumbnailQualifiedPTR,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.ThumbnailAsset],
    },
  },
  chartType: ChartType.Spline,
  hideTotalSeriesInChart: true,
} as const satisfies ChartConfig;

export const chartConfigThumbnailL7QualifiedPTR = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.ThumbnailL7QualifiedPTR,
  titleKey: translationKey('Label.Metric.ThumbnailL7QualifiedPTR', TranslationNamespace.Analytics),
  metric: RAQIV2Metric.ThumbnailL7QualifiedPTR,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.ThumbnailAsset],
    },
  },
  chartType: ChartType.Spline,
  hideTotalSeriesInChart: true,
} as const satisfies ChartConfig;

export const chartConfigThumbnailImpressions = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.ThumbnailImpressions,
  titleKey: translationKey('Label.Metric.ThumbnailImpressions', TranslationNamespace.Analytics),
  metric: RAQIV2Metric.ThumbnailImpressions,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.ThumbnailAsset],
    },
  },
  chartType: ChartType.Spline,
  hideTotalSeriesInChart: true,
} as const satisfies ChartConfig;

export const chartConfigHomeRecommendationImpressions = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.HomeRecommendationImpressions,
  titleKey: translationKey(
    'Label.Metric.HomeRecommendationImpressions',
    TranslationNamespace.Analytics,
  ),
  definitionTooltipKey: translationKey(
    'Description.HomeRecommendationImpressions',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.UniqueUsersWithImpressions,
  overrides: {
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.AcquisitionSource,
          values: [RAQIV2AcquisitionSource.HomeRecommendation],
        },
      ],
    },
  },
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigHomeRecommendationPlays = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.HomeRecommendationPlays,
  titleKey: translationKey('Label.Metric.HomeRecommendationPlays', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.HomeRecommendationPlays',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.UniqueUsersWithPlaySessions,
  overrides: {
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.AcquisitionSource,
          values: [RAQIV2AcquisitionSource.HomeRecommendation],
        },
      ],
    },
  },
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigRFYL7PlayDays = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.RFYL7PlayDays,
  titleKey: translationKey('Label.Metric.RFYL7PlayDays', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey('Description.RFYL7PlayDays', TranslationNamespace.Analytics),
  metric: RAQIV2Metric.RFYL7PlayDays,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const chartConfigRFYL7PlayTime = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.RFYL7PlayTime,
  titleKey: translationKey('Label.Metric.RFYL7PlayTime', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey('Description.RFYL7PlayTime', TranslationNamespace.Analytics),
  metric: RAQIV2Metric.RFYL7PlayTime,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const chartConfigRFYL7RobuxSpent = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.RFYL7RobuxSpent,
  titleKey: translationKey('Label.Metric.RFYL7RobuxSpent', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.RFYL7RobuxSpent',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.RFYL7RobuxSpent,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const chartConfigRFYL7RobuxSpentDays = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.RFYL7RobuxSpentDays,
  titleKey: translationKey('Label.Metric.RFYL7RobuxSpentDays', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.RFYL7RobuxSpentDays',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.RFYL7RobuxSpentDays,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const chartConfigRFYL7IntentionalCoplayDays = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.RFYL7IntentionalCoplayDays,
  titleKey: translationKey(
    'Label.Metric.RFYL7IntentionalCoplayDays',
    TranslationNamespace.Analytics,
  ),
  definitionTooltipKey: translationKey(
    'Description.RFYL7IntentionalCoplayDays',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.RFYL7IntentionalCoplayDays,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const chartConfigRFYDeepEngagementRate = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.RFYDeepEngagementRate,
  titleKey: translationKey('Label.Metric.RFYDeepEngagementRate', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.RFYDeepEngagementRate',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.RFYDeepEngagementRate,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const chartConfigRFYL7PlaySessionsPerUser = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Label.Metric.RFYL7PlaySessionsPerUser', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.RFYL7PlaySessionsPerUser',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.RFYL7PlaySessionsPerUser,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const chartConfigUniqueNotInterestedUsers = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey(
    'Label.Metric.RFYUniqueNotInterestedUsers',
    TranslationNamespace.Analytics,
  ),
  definitionTooltipKey: translationKey(
    'Description.RFYUniqueNotInterestedUsersPerMillionImpressions',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.RFYUniqueNotInterestedUsersPerMillionImpressions,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const chartConfigRFYQualifiedPTR = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.RFYQualifiedPTR,
  titleKey: translationKey('Label.Metric.RFYQualifiedPTR', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.RFYQualifiedPTR',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.RFYQualifiedPTR,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const chartConfigL7AverageRFYQualifiedPTR = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.L7AverageRFYQualifiedPTR', TranslationNamespace.Analytics),
  titleKeyByContext: {
    scorecard: translationKey(
      'Title.L7AverageRFYQualifiedPTR.Scorecard',
      TranslationNamespace.Analytics,
    ),
  },
  definitionTooltipKey: translationKey(
    'Description.L7AverageRFYQualifiedPTR',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.L7AverageRFYQualifiedPTR,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const chartConfigPlayerFeedbackVotesCountByVoteType = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.PlayerFeedbackVotesCountByVoteType,
  titleKey: translationKey(
    'Title.PlayerFeedbackVotesCountByVoteType',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.PlayerFeedbackVotesCount,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.VoteType],
    },
  },
  summarySpec: {
    totalSummaryTypes: [],
    perBreakdownSummaryTypes: [
      {
        type: RAQIV2SummaryType.TotalAbsoluteValue,
      },
    ],
    breakdownSummaryFilter: {
      [RAQIV2Dimension.VoteType]: [RAQIV2VoteType.Upvote],
    },
    aggregatedBreakdownSummaryTypes: [],
  },
  chartType: ChartType.Column,
  // NOTE(gperkins@ 20240207): This is a misuse of the column component because not all
  // of the breakdowns shown are all positive or all negative. See CSGO-104 for discussion of followups.
  hideTotalSeriesBecauseAllBreakdownsAreUniformlyPositiveOrNegative: true,
} as const satisfies ChartConfig;

export const chartConfigQualifiedPTRAndImpressionComparison = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.QualifiedPTRAndImpressionComparison,
  titleKey: translationKey('Label.Metric.RFYQualifiedPTR', TranslationNamespace.Analytics),
  metricsConfig: [
    {
      metric: RAQIV2Metric.RFYQualifiedPTR,
      overrides: {},
    },
    {
      metric: RAQIV2Metric.UniqueUsersWithImpressions,
      overrides: {
        filter: {
          intersect: [
            {
              dimension: RAQIV2Dimension.AcquisitionSource,
              values: [RAQIV2AcquisitionSource.HomeRecommendation],
            },
          ],
        },
      },
    },
  ],
  chartType: ChartType.MultipleMetricSpline,
} as const satisfies ChartConfig;

export const chartConfigCommerceImpressions: ChartConfig = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.CommerceImpressions,
  titleKey: translationKey('Label.Metric.CommerceImpressions', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.CommerceImpressions',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.CommerceImpressions,
  overrides: {},
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
};

export const chartConfigCommerceClicks: ChartConfig = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.CommerceClicks,
  titleKey: translationKey('Label.Metric.CommerceClicks', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.CommerceClicks',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.CommerceClicks,
  overrides: {},
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
};

export const chartConfigCommerceCheckouts: ChartConfig = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.CommerceCheckouts,
  titleKey: translationKey('Label.Metric.CommerceCheckouts', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.CommerceCheckouts',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.CommerceCheckouts,
  overrides: {},
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
};

export const chartConfigCommerceOrders: ChartConfig = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.CommerceOrders,
  titleKey: translationKey('Label.Metric.CommerceOrders', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.CommerceOrders',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.CommerceOrders,
  overrides: {},
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
};

export const chartConfigCommerceGMV: ChartConfig = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.CommerceGMV,
  titleKey: translationKey('Label.Metric.CommerceGMV', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey('Description.CommerceGMV', TranslationNamespace.Analytics),
  metric: RAQIV2Metric.CommerceGMV,
  overrides: {},
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
};

export const chartConfigCommerceQuantitySold: ChartConfig = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.CommerceQuantitySold,
  titleKey: translationKey('Label.Metric.CommerceQuantitySold', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.CommerceQuantitySold',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.CommerceQuantitySold,
  overrides: {},
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
};

export const chartConfigCommerceUniqueImpressions: ChartConfig = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.CommerceUniqueImpressions,
  titleKey: translationKey(
    'Label.Metric.CommerceUniqueImpressions',
    TranslationNamespace.Analytics,
  ),
  definitionTooltipKey: translationKey(
    'Description.CommerceUniqueImpressions',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.CommerceUniqueImpressions,
  overrides: {},
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
};

export const chartConfigCommerceUniqueClicks: ChartConfig = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.CommerceUniqueClicks,
  titleKey: translationKey('Label.Metric.CommerceUniqueClicks', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.CommerceUniqueClicks',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.CommerceUniqueClicks,
  overrides: {},
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
};

export const chartConfigCommerceUniqueCheckouts: ChartConfig = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.CommerceUniqueCheckouts,
  titleKey: translationKey('Label.Metric.CommerceUniqueCheckouts', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.CommerceUniqueCheckouts',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.CommerceUniqueCheckouts,
  overrides: {},
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
};

export const chartConfigCommerceUniqueOrders: ChartConfig = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.CommerceUniqueOrders,
  titleKey: translationKey('Label.Metric.CommerceUniqueOrders', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.CommerceUniqueOrders',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.CommerceUniqueOrders,
  overrides: {},
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
};

// Ads Insights
export const chartConfigSponsoredAdPlays: ChartConfig = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.SponsoredAdPlays,
  titleKey: translationKey('Title.SponsoredAdPlays', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.SponsoredAdPlays',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.SponsoredAdPlays,
  overrides: {},
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
};

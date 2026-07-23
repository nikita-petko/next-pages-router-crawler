import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import {
  analyticsEngagementNavigationItem,
  analyticsMonetizationNavigationItem,
  analyticsRetentionNavigationItem,
  analyticsUserAcquisitionNavigationItem,
} from '@modules/charts-generic/constants/analyticsNavigationItems';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { ChartConfig } from '../../types/RAQIV2ChartConfig';
import type { TabbedChartConfig } from '../../types/RAQIV2TabbedChartConfig';
import { OnboardingFeatureKey, OnboardingStepKey } from '../onboardingTipsConfigs';
import RAQIV2PredefinedTabbedChartKey from '../RAQIV2PredefinedTabbedChartKey';
import {
  chartConfigAcquisitionNewUsersWithImpressionsV2,
  chartConfigAcquisitionNewUsersWithImpressionsV2Migration,
  chartConfigAcquisitionNewUsersWithPlaysV2,
  chartConfigAcquisitionNewUsersWithPlaysV2Migration,
  chartConfigAcquisitionReturningUsersWithImpressionsV2,
  chartConfigAcquisitionReturningUsersWithImpressionsV2Migration,
  chartConfigAcquisitionReturningUsersWithPlaysV2,
  chartConfigAcquisitionReturningUsersWithPlaysV2Migration,
  chartConfigForwardD1RetentionByTopAcquisitionSources,
  chartConfigL7AverageForwardD1RetentionByTopAcquisitionSources,
  chartConfigL7AverageAcquisitionNewUsersWithPlaysV2,
  chartConfigDailyActiveUsers,
  chartConfigL7AverageDailyActiveUsers,
  chartConfigDailyRevenue,
  chartConfigL7AverageDailyRevenue,
  chartConfigEngagementAveragePlayTimePerDAU,
  chartConfigL7AveragePlayTimePerDAU,
  chartConfigEngagementNewUsers,
  chartConfigEngagementNewUsersSessionTime,
  chartConfigEngagementReturningUsers,
  chartConfigEngagementReturningUsersSessionTime,
  chartConfigTopSinksMigration,
  chartConfigTopSourcesMigration,
} from './PredefinedChartConfigLiterals';

const rfyFirstPlayBounceRateTitleKey = translationKey(
  'Label.Metric.RFYFirstPlayBounceRate',
  TranslationNamespace.Analytics,
);
const rfyPlaytimePerUserTitleKey = translationKey(
  'Label.Metric.RFYPlaytimePerUser',
  TranslationNamespace.Analytics,
);
const rfyQualifiedPlaySessionsPerUserTitleKey = translationKey(
  'Label.Metric.RFYQualifiedPlaySessionsPerUser',
  TranslationNamespace.Analytics,
);
const rfyPlayDaysPerUserTitleKey = translationKey(
  'Label.Metric.RFYPlayDaysPerUser',
  TranslationNamespace.Analytics,
);
const rfyRobuxSpentPerUserTitleKey = translationKey(
  'Label.Metric.RFYRobuxSpentPerUser',
  TranslationNamespace.Analytics,
);
const rfySpendDaysPerUserTitleKey = translationKey(
  'Label.Metric.RFYSpendDaysPerUser',
  TranslationNamespace.Analytics,
);
const rfyCoplayDaysPerUserTitleKey = translationKey(
  'Label.Metric.RFYCoplayDaysPerUser',
  TranslationNamespace.Analytics,
);

const rfyFirstPlayBounceRateDescriptionKey = translationKey(
  'Description.RFYFirstPlayBounceRate',
  TranslationNamespace.Analytics,
);
const rfyPlaytimePerUserDescriptionKey = translationKey(
  'Description.RFYPlaytimePerUser',
  TranslationNamespace.Analytics,
);
const rfyQualifiedPlaySessionsPerUserDescriptionKey = translationKey(
  'Description.RFYQualifiedPlaySessionsPerUser',
  TranslationNamespace.Analytics,
);
const rfyPlayDaysPerUserDescriptionKey = translationKey(
  'Description.RFYPlayDaysPerUser',
  TranslationNamespace.Analytics,
);
const rfyRobuxSpentPerUserDescriptionKey = translationKey(
  'Description.RFYRobuxSpentPerUser',
  TranslationNamespace.Analytics,
);
const rfySpendDaysPerUserDescriptionKey = translationKey(
  'Description.RFYSpendDaysPerUser',
  TranslationNamespace.Analytics,
);
const rfyCoplayDaysPerUserDescriptionKey = translationKey(
  'Description.RFYCoplayDaysPerUser',
  TranslationNamespace.Analytics,
);

const rfyD1SpendDaysChart = {
  type: AnalyticsComponentType.Chart,
  titleKey: rfySpendDaysPerUserTitleKey,
  metric: RAQIV2Metric.RFYD1SpendDay,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

const rfyD2To7SpendDaysChart = {
  type: AnalyticsComponentType.Chart,
  titleKey: rfySpendDaysPerUserTitleKey,
  metric: RAQIV2Metric.RFYD2To7SpendDays,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

const rfyD8To28SpendDaysChart = {
  type: AnalyticsComponentType.Chart,
  titleKey: rfySpendDaysPerUserTitleKey,
  metric: RAQIV2Metric.RFYD8To28SpendDays,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

const rfyD1PlaytimeChart = {
  type: AnalyticsComponentType.Chart,
  titleKey: rfyPlaytimePerUserTitleKey,
  metric: RAQIV2Metric.RFYD1Playtime,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

const rfyD2To7PlaytimeChart = {
  type: AnalyticsComponentType.Chart,
  titleKey: rfyPlaytimePerUserTitleKey,
  metric: RAQIV2Metric.RFYD2To7Playtime,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

const rfyD8To28PlaytimeChart = {
  type: AnalyticsComponentType.Chart,
  titleKey: rfyPlaytimePerUserTitleKey,
  metric: RAQIV2Metric.RFYD8To28Playtime,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

const rfyD1QualifiedPlaySessionsChart = {
  type: AnalyticsComponentType.Chart,
  titleKey: rfyQualifiedPlaySessionsPerUserTitleKey,
  metric: RAQIV2Metric.RFYD1QualifiedPlaySessions,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

const rfyD2To7QualifiedPlaySessionsChart = {
  type: AnalyticsComponentType.Chart,
  titleKey: rfyQualifiedPlaySessionsPerUserTitleKey,
  metric: RAQIV2Metric.RFYD2To7QualifiedPlaySessions,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

const rfyD8To28QualifiedPlaySessionsChart = {
  type: AnalyticsComponentType.Chart,
  titleKey: rfyQualifiedPlaySessionsPerUserTitleKey,
  metric: RAQIV2Metric.RFYD8To28QualifiedPlaySessions,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

const rfyD2To7PlayDaysChart = {
  type: AnalyticsComponentType.Chart,
  titleKey: rfyPlayDaysPerUserTitleKey,
  metric: RAQIV2Metric.RFYD2To7PlayDays,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

const rfyD8To28PlayDaysChart = {
  type: AnalyticsComponentType.Chart,
  titleKey: rfyPlayDaysPerUserTitleKey,
  metric: RAQIV2Metric.RFYD8To28PlayDays,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

const rfyD1CoplayDaysChart = {
  type: AnalyticsComponentType.Chart,
  titleKey: rfyCoplayDaysPerUserTitleKey,
  metric: RAQIV2Metric.RFYD1CoplayDays,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

const rfyD2To7CoplayDaysChart = {
  type: AnalyticsComponentType.Chart,
  titleKey: rfyCoplayDaysPerUserTitleKey,
  metric: RAQIV2Metric.RFYD2To7CoplayDays,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

const rfyD8To28CoplayDaysChart = {
  type: AnalyticsComponentType.Chart,
  titleKey: rfyCoplayDaysPerUserTitleKey,
  metric: RAQIV2Metric.RFYD8To28CoplayDays,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

const rfyD1RobuxSpendChart = {
  type: AnalyticsComponentType.Chart,
  titleKey: rfyRobuxSpentPerUserTitleKey,
  metric: RAQIV2Metric.RFYD1RobuxSpend,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

const rfyD2To7RobuxSpendChart = {
  type: AnalyticsComponentType.Chart,
  titleKey: rfyRobuxSpentPerUserTitleKey,
  metric: RAQIV2Metric.RFYD2To7RobuxSpend,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

const rfyD8To28RobuxSpendChart = {
  type: AnalyticsComponentType.Chart,
  titleKey: rfyRobuxSpentPerUserTitleKey,
  metric: RAQIV2Metric.RFYD8To28RobuxSpend,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

const rfyFirstPlayBounceRateUnder60SecondsChart = {
  type: AnalyticsComponentType.Chart,
  titleKey: rfyFirstPlayBounceRateTitleKey,
  metric: RAQIV2Metric.RFYDuration0To60,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

const rfyFirstPlayBounceRate61To180SecondsChart = {
  type: AnalyticsComponentType.Chart,
  titleKey: rfyFirstPlayBounceRateTitleKey,
  metric: RAQIV2Metric.RFYDuration61To180,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

const rfyDay1Tab = {
  tabLabel: translationKey('Label.RFYDay1Average', TranslationNamespace.Analytics),
};

const rfyDays2To7Tab = {
  tabLabel: translationKey('Label.RFYDay2To7Average', TranslationNamespace.Analytics),
};

const rfyDays8To28Tab = {
  tabLabel: translationKey('Label.RFYDay8To28Average', TranslationNamespace.Analytics),
};

const rfyUnder60SecondsTab = {
  tabLabel: translationKey('Label.RFYUnder60SecondsAverageRate', TranslationNamespace.Analytics),
};

const rfy61To180SecondsTab = {
  tabLabel: translationKey('Label.RFY61To180SecondsAverageRate', TranslationNamespace.Analytics),
};

export const tabbedChartConfigRFYFirstPlayBounceRate = {
  type: AnalyticsComponentType.TabbedChart,
  titleKey: rfyFirstPlayBounceRateTitleKey,
  definitionTooltipKey: rfyFirstPlayBounceRateDescriptionKey,
  tabs: [
    {
      ...rfyUnder60SecondsTab,
      chart: rfyFirstPlayBounceRateUnder60SecondsChart,
    },
    {
      ...rfy61To180SecondsTab,
      chart: rfyFirstPlayBounceRate61To180SecondsChart,
    },
  ],
} as const satisfies TabbedChartConfig;

export const tabbedChartConfigRFYPlaytimePerUser = {
  type: AnalyticsComponentType.TabbedChart,
  titleKey: rfyPlaytimePerUserTitleKey,
  definitionTooltipKey: rfyPlaytimePerUserDescriptionKey,
  tabs: [
    {
      ...rfyDays8To28Tab,
      chart: rfyD8To28PlaytimeChart,
    },
    {
      ...rfyDays2To7Tab,
      chart: rfyD2To7PlaytimeChart,
    },
    {
      ...rfyDay1Tab,
      chart: rfyD1PlaytimeChart,
    },
  ],
} as const satisfies TabbedChartConfig;

export const tabbedChartConfigRFYQualifiedPlaySessionsPerUser = {
  type: AnalyticsComponentType.TabbedChart,
  titleKey: rfyQualifiedPlaySessionsPerUserTitleKey,
  definitionTooltipKey: rfyQualifiedPlaySessionsPerUserDescriptionKey,
  tabs: [
    {
      ...rfyDays8To28Tab,
      chart: rfyD8To28QualifiedPlaySessionsChart,
    },
    {
      ...rfyDays2To7Tab,
      chart: rfyD2To7QualifiedPlaySessionsChart,
    },
    {
      ...rfyDay1Tab,
      chart: rfyD1QualifiedPlaySessionsChart,
    },
  ],
} as const satisfies TabbedChartConfig;

export const tabbedChartConfigRFYPlayDays = {
  type: AnalyticsComponentType.TabbedChart,
  titleKey: rfyPlayDaysPerUserTitleKey,
  definitionTooltipKey: rfyPlayDaysPerUserDescriptionKey,
  tabs: [
    {
      ...rfyDays8To28Tab,
      chart: rfyD8To28PlayDaysChart,
    },
    {
      ...rfyDays2To7Tab,
      chart: rfyD2To7PlayDaysChart,
    },
  ],
} as const satisfies TabbedChartConfig;

export const tabbedChartConfigRFYRobuxSpend = {
  type: AnalyticsComponentType.TabbedChart,
  titleKey: rfyRobuxSpentPerUserTitleKey,
  definitionTooltipKey: rfyRobuxSpentPerUserDescriptionKey,
  tabs: [
    {
      ...rfyDays8To28Tab,
      chart: rfyD8To28RobuxSpendChart,
    },
    {
      ...rfyDays2To7Tab,
      chart: rfyD2To7RobuxSpendChart,
    },
    {
      ...rfyDay1Tab,
      chart: rfyD1RobuxSpendChart,
    },
  ],
} as const satisfies TabbedChartConfig;

export const tabbedChartConfigRFYSpendDays = {
  type: AnalyticsComponentType.TabbedChart,
  titleKey: rfySpendDaysPerUserTitleKey,
  definitionTooltipKey: rfySpendDaysPerUserDescriptionKey,
  tabs: [
    {
      ...rfyDays8To28Tab,
      chart: rfyD8To28SpendDaysChart,
    },
    {
      ...rfyDays2To7Tab,
      chart: rfyD2To7SpendDaysChart,
    },
    {
      ...rfyDay1Tab,
      chart: rfyD1SpendDaysChart,
    },
  ],
} as const satisfies TabbedChartConfig;

export const tabbedChartConfigRFYCoplayDays = {
  type: AnalyticsComponentType.TabbedChart,
  titleKey: rfyCoplayDaysPerUserTitleKey,
  definitionTooltipKey: rfyCoplayDaysPerUserDescriptionKey,
  tabs: [
    {
      ...rfyDays8To28Tab,
      chart: rfyD8To28CoplayDaysChart,
    },
    {
      ...rfyDays2To7Tab,
      chart: rfyD2To7CoplayDaysChart,
    },
    {
      ...rfyDay1Tab,
      chart: rfyD1CoplayDaysChart,
    },
  ],
} as const satisfies TabbedChartConfig;

export const tabbedChartConfigTopSourcesAndSinksMigration = {
  type: AnalyticsComponentType.TabbedChart,
  chartKey: RAQIV2PredefinedTabbedChartKey.TopSourcesAndSinksMigration,
  titleKey: translationKey('Title.TopSourcesAndSinks', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.TopSourcesAndSinks',
    TranslationNamespace.Analytics,
  ),
  tabs: [
    {
      chart: chartConfigTopSinksMigration,
      tabLabel: translationKey(
        'Label.TotalSinksOverSelectedPeriod',
        TranslationNamespace.Analytics,
      ),
    },
    {
      chart: chartConfigTopSourcesMigration,
      tabLabel: translationKey(
        'Label.TotalSourcesOverSelectedPeriod',
        TranslationNamespace.Analytics,
      ),
    },
  ],
} as const satisfies TabbedChartConfig;

export const tabbedChartConfigImpressionsPerSource = {
  type: AnalyticsComponentType.TabbedChart,
  chartKey: RAQIV2PredefinedTabbedChartKey.ImpressionsPerSource,
  titleKey: translationKey('Title.AcquisitionImpressionsPerSource', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.AcquisitionImpressionsPerSource',
    TranslationNamespace.Analytics,
  ),
  tabs: [
    {
      chart: chartConfigAcquisitionNewUsersWithImpressionsV2,
      tabLabel: translationKey('Title.NewUsers', TranslationNamespace.Analytics),
    },
    {
      chart: chartConfigAcquisitionReturningUsersWithImpressionsV2,
      tabLabel: translationKey('Title.ReturningUsers', TranslationNamespace.Analytics),
    },
  ],
} as const satisfies TabbedChartConfig;

export const tabbedChartConfigImpressionsPerSourceMigration = {
  type: AnalyticsComponentType.TabbedChart,
  chartKey: RAQIV2PredefinedTabbedChartKey.ImpressionsPerSourceMigration,
  titleKey: translationKey('Title.AcquisitionImpressionsPerSource', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.AcquisitionImpressionsPerSource',
    TranslationNamespace.Analytics,
  ),
  tabs: [
    {
      chart: chartConfigAcquisitionNewUsersWithImpressionsV2Migration,
      tabLabel: translationKey('Title.NewUsers', TranslationNamespace.Analytics),
    },
    {
      chart: chartConfigAcquisitionReturningUsersWithImpressionsV2Migration,
      tabLabel: translationKey('Title.ReturningUsers', TranslationNamespace.Analytics),
    },
  ],
} as const satisfies TabbedChartConfig;

export const tabbedChartConfigPlaysPerSource = {
  type: AnalyticsComponentType.TabbedChart,
  chartKey: RAQIV2PredefinedTabbedChartKey.PlaysPerSource,
  titleKey: translationKey('Title.AcquisitionPlaysPerSource', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.AcquisitionPlaysPerSource',
    TranslationNamespace.Analytics,
  ),
  tabs: [
    {
      chart: chartConfigAcquisitionNewUsersWithPlaysV2,
      tabLabel: translationKey('Title.NewUsers', TranslationNamespace.Analytics),
    },
    {
      chart: chartConfigAcquisitionReturningUsersWithPlaysV2,
      tabLabel: translationKey('Title.ReturningUsers', TranslationNamespace.Analytics),
    },
  ],
} as const satisfies TabbedChartConfig;

export const tabbedChartConfigPlaysPerSourceMigration = {
  type: AnalyticsComponentType.TabbedChart,
  chartKey: RAQIV2PredefinedTabbedChartKey.PlaysPerSourceMigration,
  titleKey: translationKey('Title.AcquisitionPlaysPerSource', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.AcquisitionPlaysPerSource',
    TranslationNamespace.Analytics,
  ),
  tabs: [
    {
      chart: chartConfigAcquisitionNewUsersWithPlaysV2Migration,
      tabLabel: translationKey('Title.NewUsers', TranslationNamespace.Analytics),
    },
    {
      chart: chartConfigAcquisitionReturningUsersWithPlaysV2Migration,
      tabLabel: translationKey('Title.ReturningUsers', TranslationNamespace.Analytics),
    },
  ],
} as const satisfies TabbedChartConfig;

export const tabbedChartConfigDailyActiveUsers = {
  type: AnalyticsComponentType.TabbedChart,
  chartKey: RAQIV2PredefinedTabbedChartKey.DailyActiveUsers,
  titleKey: translationKey('Title.NewAndReturningUser', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.NewAndReturningUser',
    TranslationNamespace.Analytics,
  ),
  tabs: [
    {
      chart: chartConfigEngagementNewUsers,
      tabLabel: translationKey('Title.NewUsers', TranslationNamespace.Analytics),
    },
    {
      chart: chartConfigEngagementReturningUsers,
      tabLabel: translationKey('Title.ReturningUsers', TranslationNamespace.Analytics),
    },
  ],
} as const satisfies TabbedChartConfig;

export const tabbedChartConfigEngagementSessionTime = {
  type: AnalyticsComponentType.TabbedChart,
  chartKey: RAQIV2PredefinedTabbedChartKey.EngagementSessionTime,
  titleKey: translationKey('Title.NewAndReturningUsersSessionTime', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.NewAndReturningUsersSessionTime',
    TranslationNamespace.Analytics,
  ),
  tabs: [
    {
      chart: chartConfigEngagementNewUsersSessionTime,
      tabLabel: translationKey('Title.NewUsersSessionTime', TranslationNamespace.Analytics),
    },
    {
      chart: chartConfigEngagementReturningUsersSessionTime,
      tabLabel: translationKey('Title.ReturningUsersSessionTime', TranslationNamespace.Analytics),
    },
  ],
} as const satisfies TabbedChartConfig;

const tabbedChartConfigExperienceAnalyticsSummaryV3Base = {
  type: AnalyticsComponentType.TabbedChart,
  chartKey: RAQIV2PredefinedTabbedChartKey.ExperienceAnalyticsSummaryV3,
  titleKey: translationKey('Title.Snapshot', TranslationNamespace.Insights),
  tabs: [
    {
      chart: chartConfigForwardD1RetentionByTopAcquisitionSources,
      tabLabel: translationKey('Title.ForwardD1Retention', TranslationNamespace.Analytics),
      action: {
        actionLabel: translationKey('Action.ViewRetention', TranslationNamespace.Analytics),
        actionTargetNavigationItem: analyticsRetentionNavigationItem,
        actionEventName: 'analytics/overview/chartVisitPageClick',
      },
    },
    {
      chart: chartConfigAcquisitionNewUsersWithPlaysV2,
      tabLabel: translationKey('Title.NewUsers', TranslationNamespace.Analytics),
      action: {
        actionLabel: translationKey('Action.ViewUserAcquisition', TranslationNamespace.Analytics),
        actionTargetNavigationItem: analyticsUserAcquisitionNavigationItem,
        actionEventName: 'analytics/overview/chartVisitPageClick',
      },
    },
    {
      chart: chartConfigEngagementAveragePlayTimePerDAU,
      tabLabel: translationKey('Title.AveragePlayTimePerDAU', TranslationNamespace.Analytics),
      action: {
        actionLabel: translationKey('Action.ViewEngagement', TranslationNamespace.Analytics),
        actionTargetNavigationItem: analyticsEngagementNavigationItem,
        actionEventName: 'analytics/overview/chartVisitPageClick',
      },
    },
    {
      chart: chartConfigDailyActiveUsers,
      tabLabel: translationKey('Title.DAU', TranslationNamespace.Analytics),
      action: {
        actionLabel: translationKey('Action.ViewEngagement', TranslationNamespace.Analytics),
        actionTargetNavigationItem: analyticsEngagementNavigationItem,
        actionEventName: 'analytics/overview/chartVisitPageClick',
      },
    },
    {
      chart: chartConfigDailyRevenue,
      tabLabel: translationKey('Title.Robux', TranslationNamespace.Analytics),
      action: {
        actionLabel: translationKey('Action.ViewMonetization', TranslationNamespace.Analytics),
        actionTargetNavigationItem: analyticsMonetizationNavigationItem,
        actionEventName: 'analytics/overview/chartVisitPageClick',
      },
    },
  ],
} as const satisfies TabbedChartConfig;

export const tabbedChartConfigExperienceAnalyticsSummaryV3 =
  tabbedChartConfigExperienceAnalyticsSummaryV3Base;

// Daily snapshot config - used when feature flag is enabled and user selects "Daily"
const tabbedChartConfigExperienceAnalyticsSummaryV3Daily = {
  type: AnalyticsComponentType.TabbedChart,
  chartKey: RAQIV2PredefinedTabbedChartKey.ExperienceAnalyticsSummaryV3,
  titleKey: translationKey('Title.DailySnapshot', TranslationNamespace.Insights),
  tabs: [
    {
      chart: chartConfigForwardD1RetentionByTopAcquisitionSources,
      tabLabel: translationKey('Title.ForwardD1Retention', TranslationNamespace.Analytics),
      action: {
        actionLabel: translationKey('Action.ViewRetention', TranslationNamespace.Analytics),
        actionTargetNavigationItem: analyticsRetentionNavigationItem,
        actionEventName: 'analytics/overview/chartVisitPageClick',
      },
    },
    {
      chart: chartConfigAcquisitionNewUsersWithPlaysV2,
      tabLabel: translationKey('Title.NewUsers', TranslationNamespace.Analytics),
      action: {
        actionLabel: translationKey('Action.ViewUserAcquisition', TranslationNamespace.Analytics),
        actionTargetNavigationItem: analyticsUserAcquisitionNavigationItem,
        actionEventName: 'analytics/overview/chartVisitPageClick',
      },
    },
    {
      chart: chartConfigEngagementAveragePlayTimePerDAU,
      tabLabel: translationKey('Title.AveragePlayTimePerDAU', TranslationNamespace.Analytics),
      action: {
        actionLabel: translationKey('Action.ViewEngagement', TranslationNamespace.Analytics),
        actionTargetNavigationItem: analyticsEngagementNavigationItem,
        actionEventName: 'analytics/overview/chartVisitPageClick',
      },
    },
    {
      chart: chartConfigDailyActiveUsers,
      tabLabel: translationKey('Title.DAU', TranslationNamespace.Analytics),
      action: {
        actionLabel: translationKey('Action.ViewEngagement', TranslationNamespace.Analytics),
        actionTargetNavigationItem: analyticsEngagementNavigationItem,
        actionEventName: 'analytics/overview/chartVisitPageClick',
      },
    },
    {
      chart: chartConfigDailyRevenue,
      tabLabel: translationKey('Title.Robux', TranslationNamespace.Analytics),
      action: {
        actionLabel: translationKey('Action.ViewMonetization', TranslationNamespace.Analytics),
        actionTargetNavigationItem: analyticsMonetizationNavigationItem,
        actionEventName: 'analytics/overview/chartVisitPageClick',
      },
    },
  ],
} as const satisfies TabbedChartConfig;

const tabbedChartConfigExperienceAnalyticsSummaryV3L7 = {
  type: AnalyticsComponentType.TabbedChart,
  chartKey: RAQIV2PredefinedTabbedChartKey.ExperienceAnalyticsSummaryV3,
  titleKey: translationKey('Title.SnapshotL7MovingAverages', TranslationNamespace.Insights),
  definitionTooltipKey: translationKey(
    'Description.SnapshotL7MovingAverages',
    TranslationNamespace.Insights,
  ),
  onboardingTipsConfig: {
    featureKey: OnboardingFeatureKey.CreatorHubAnalyticsOverviewL7Metrics,
    stepKey: OnboardingStepKey.OverviewL7Snapshot,
  },
  tabs: [
    {
      chart: chartConfigL7AverageForwardD1RetentionByTopAcquisitionSources,
      tabLabel: translationKey('Title.ForwardD1Retention', TranslationNamespace.Analytics),
      action: {
        actionLabel: translationKey('Action.ViewRetention', TranslationNamespace.Analytics),
        actionTargetNavigationItem: analyticsRetentionNavigationItem,
        actionEventName: 'analytics/overview/chartVisitPageClick',
      },
    },
    {
      chart: chartConfigL7AverageAcquisitionNewUsersWithPlaysV2,
      tabLabel: translationKey('Title.NewUsers', TranslationNamespace.Analytics),
      action: {
        actionLabel: translationKey('Action.ViewUserAcquisition', TranslationNamespace.Analytics),
        actionTargetNavigationItem: analyticsUserAcquisitionNavigationItem,
        actionEventName: 'analytics/overview/chartVisitPageClick',
      },
    },
    {
      chart: chartConfigL7AveragePlayTimePerDAU,
      tabLabel: translationKey('Title.AveragePlayTimePerDAU', TranslationNamespace.Analytics),
      action: {
        actionLabel: translationKey('Action.ViewEngagement', TranslationNamespace.Analytics),
        actionTargetNavigationItem: analyticsEngagementNavigationItem,
        actionEventName: 'analytics/overview/chartVisitPageClick',
      },
    },
    {
      chart: chartConfigL7AverageDailyActiveUsers,
      tabLabel: translationKey('Title.DAU', TranslationNamespace.Analytics),
      action: {
        actionLabel: translationKey('Action.ViewEngagement', TranslationNamespace.Analytics),
        actionTargetNavigationItem: analyticsEngagementNavigationItem,
        actionEventName: 'analytics/overview/chartVisitPageClick',
      },
    },
    {
      chart: chartConfigL7AverageDailyRevenue,
      tabLabel: translationKey('Title.Robux', TranslationNamespace.Analytics),
      action: {
        actionLabel: translationKey('Action.ViewMonetization', TranslationNamespace.Analytics),
        actionTargetNavigationItem: analyticsMonetizationNavigationItem,
        actionEventName: 'analytics/overview/chartVisitPageClick',
      },
    },
  ],
} as const satisfies TabbedChartConfig;

export const getTabbedChartConfigExperienceAnalyticsSummaryV3 = (
  useL7Metrics = true,
): TabbedChartConfig =>
  useL7Metrics
    ? tabbedChartConfigExperienceAnalyticsSummaryV3L7
    : tabbedChartConfigExperienceAnalyticsSummaryV3Daily;

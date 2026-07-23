import {
  analyticsEngagementNavigationItem,
  analyticsMonetizationNavigationItem,
  analyticsRetentionNavigationItem,
  analyticsUserAcquisitionNavigationItem,
} from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { TabbedChartConfig } from '../RAQIV2PredefinedTabbedChartConfig';
import { OnboardingFeatureKey, OnboardingStepKey } from '../onboardingTipsConfigs';
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
import RAQIV2PredefinedTabbedChartKey from '../RAQIV2PredefinedTabbedChartKey';

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

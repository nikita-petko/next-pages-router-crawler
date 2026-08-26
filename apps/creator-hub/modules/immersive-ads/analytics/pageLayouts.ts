import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import {
  OnboardingFeatureKey,
  OnboardingStepKey,
} from '@modules/experience-analytics-shared/constants/onboardingTipsConfigs';
import type { RAQIV2UIComponent } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import cardConfigs from './configs/cardConfigs';
import chartConfigs from './configs/chartConfigs';
import configConstants from './configs/configConstants';
import rewardedVideoChartConfigs from './configs/rewardedVideoChartConfigs';
import { AnalyticsViewType } from './utils';

export const overviewPageLayout: RAQIV2UIComponent[] = [
  {
    type: RAQIV2SpecialLayoutType.FullWidthLayout,
    items: [chartConfigs.totalRevenueRobuxChartConfig, chartConfigs.totalImpressionsChartConfig],
  },
  chartConfigs.totalRevenueRobuxPieChartConfig,
  chartConfigs.totalImpressionsPieChartConfig,
];

export const overviewPageLayoutRedesign: RAQIV2UIComponent[] = [
  {
    type: RAQIV2SpecialLayoutType.FullWidthLayout,
    items: [chartConfigs.overviewEarningsChartConfig, chartConfigs.overviewImpressionsChartConfig],
  },
  {
    type: RAQIV2SpecialLayoutType.TwoPerRowLayout,
    items: [
      chartConfigs.overviewEarningsByFormatChartConfig,
      chartConfigs.overviewImpressionsByFormatChartConfig,
    ],
    stackOnCompact: true,
  },
];

export const portalsPageLayout: RAQIV2UIComponent[] = [
  {
    type: RAQIV2SpecialLayoutType.FullWidthLayout,
    items: [chartConfigs.portalEarningsChartConfig],
  },
  {
    type: RAQIV2SpecialLayoutType.VerticalPriorityLayout,
    firstColumn: [chartConfigs.totalTeleportsSummaryChartConfig],
    secondColumn: [chartConfigs.portalsEarningsPerTeleportChartConfig],
  },
];

// Rewarded video page layout, organized into three sections per updated design:
//   1. Earnings overview
//   2. Impressions breakdown
//   3. EPM breakdown
//
// All redesign summary cards opt into `showComparisonChip` for the inline
// period-over-period chip.
//
// All three card rows use `RowLayout` so summary cards render at their
// intrinsic width and reflow responsively across breakpoints, matching the
// existing pattern used by other analytics pages (e.g. recommendation
// service, store, avatar item monetization, funnel).
export const rewardedVideoPageLayout: RAQIV2UIComponent[] = [
  // Section 1: Earnings overview
  {
    type: RAQIV2SpecialLayoutType.SectionTitle,
    titleKey: configConstants.EarningsOverviewSectionTitleKey,
    onboardingTipsConfig: {
      featureKey: OnboardingFeatureKey.CreatorHubAnalyticsImmersiveAdsRewardedVideo,
      stepKey: OnboardingStepKey.RewardedVideoEarningsOverview,
    },
  },
  {
    type: RAQIV2SpecialLayoutType.RowLayout,
    items: [
      cardConfigs.totalImpressionsCardConfig,
      cardConfigs.epmCardConfig,
      cardConfigs.totalEarningsCardConfig,
    ],
  },
  {
    type: RAQIV2SpecialLayoutType.FullWidthLayout,
    items: [rewardedVideoChartConfigs.rewardedVideoEarningsChartConfig],
  },

  // Section 2: Impressions breakdown
  {
    type: RAQIV2SpecialLayoutType.SectionTitle,
    titleKey: configConstants.ImpressionsBreakdownSectionTitleKey,
    onboardingTipsConfig: {
      featureKey: OnboardingFeatureKey.CreatorHubAnalyticsImmersiveAdsRewardedVideo,
      stepKey: OnboardingStepKey.RewardedVideoImpressionsBreakdown,
    },
  },
  {
    type: RAQIV2SpecialLayoutType.RowLayout,
    items: [
      cardConfigs.optInRateCardConfig,
      cardConfigs.dailyUniqueViewersCardConfig,
      cardConfigs.frequencyCardConfig,
      cardConfigs.totalImpressionsCardConfig,
    ],
  },
  {
    type: RAQIV2SpecialLayoutType.FullWidthLayout,
    items: [rewardedVideoChartConfigs.rewardedVideoTotalImpressionsChartConfig],
  },
  {
    type: RAQIV2SpecialLayoutType.VerticalPriorityLayout,
    firstColumn: [rewardedVideoChartConfigs.rewardedVideoOptInRateChartConfig],
    secondColumn: [rewardedVideoChartConfigs.rewardedVideoFrequencyChartConfig],
  },

  // Section 3: EPM breakdown
  {
    type: RAQIV2SpecialLayoutType.SectionTitle,
    titleKey: configConstants.EpmBreakdownSectionTitleKey,
    onboardingTipsConfig: {
      featureKey: OnboardingFeatureKey.CreatorHubAnalyticsImmersiveAdsRewardedVideo,
      stepKey: OnboardingStepKey.RewardedVideoEpmBreakdown,
    },
  },
  {
    type: RAQIV2SpecialLayoutType.RowLayout,
    items: [
      cardConfigs.fillRateCardConfigV2,
      cardConfigs.showRateCardConfig,
      cardConfigs.rewardRateCardConfig,
      cardConfigs.epmCardConfig,
    ],
  },
  {
    type: RAQIV2SpecialLayoutType.FullWidthLayout,
    items: [rewardedVideoChartConfigs.rewardedVideoFunnelChartConfig],
  },
];

// Managed Rewarded page layout: Play with Reward placements. Mirrors the
// rewarded video sections, with CTR in place of Show rate.
//
// Every config here still resolves to the tab-wide Video2D metrics, which blend
// Play with Reward with in-experience rewarded video. Scoping this tab to Play
// with Reward requires a placement type dimension that the ads publisher
// reporting namespace does not expose yet; once it lands, each card and chart
// needs an `overrides.filter.intersect` on it, following the pattern in
// `rewardedVideoFunnelChartConfig`. Until then this layout stays behind
// `isManagedRewardedTabEnabled`.
//
// Section titles deliberately omit `onboardingTipsConfig`: those steps are
// registered against the rewarded video feature key with a fixed step count,
// and reusing them here would corrupt that flow's progress tracking.
export const managedRewardedPageLayout: RAQIV2UIComponent[] = [
  // Section 1: Earnings overview
  {
    type: RAQIV2SpecialLayoutType.SectionTitle,
    titleKey: configConstants.EarningsOverviewSectionTitleKey,
  },
  {
    type: RAQIV2SpecialLayoutType.RowLayout,
    items: [
      cardConfigs.totalImpressionsCardConfig,
      cardConfigs.epmCardConfig,
      cardConfigs.totalEarningsCardConfig,
    ],
  },
  {
    type: RAQIV2SpecialLayoutType.FullWidthLayout,
    items: [rewardedVideoChartConfigs.rewardedVideoEarningsChartConfig],
  },

  // Section 2: Impressions breakdown
  {
    type: RAQIV2SpecialLayoutType.SectionTitle,
    titleKey: configConstants.ImpressionsBreakdownSectionTitleKey,
  },
  {
    type: RAQIV2SpecialLayoutType.RowLayout,
    items: [
      cardConfigs.optInRateCardConfig,
      cardConfigs.dailyUniqueViewersCardConfig,
      cardConfigs.frequencyCardConfig,
      cardConfigs.totalImpressionsCardConfig,
    ],
  },
  {
    type: RAQIV2SpecialLayoutType.FullWidthLayout,
    items: [rewardedVideoChartConfigs.rewardedVideoTotalImpressionsChartConfig],
  },
  {
    type: RAQIV2SpecialLayoutType.VerticalPriorityLayout,
    firstColumn: [rewardedVideoChartConfigs.rewardedVideoOptInRateChartConfig],
    secondColumn: [rewardedVideoChartConfigs.rewardedVideoFrequencyChartConfig],
  },

  // Section 3: EPM breakdown
  {
    type: RAQIV2SpecialLayoutType.SectionTitle,
    titleKey: configConstants.EpmBreakdownSectionTitleKey,
  },
  {
    type: RAQIV2SpecialLayoutType.RowLayout,
    items: [
      cardConfigs.fillRateCardConfigV2,
      cardConfigs.ctrCardConfig,
      cardConfigs.rewardRateCardConfig,
      cardConfigs.epmCardConfig,
    ],
  },
  {
    type: RAQIV2SpecialLayoutType.FullWidthLayout,
    items: [rewardedVideoChartConfigs.rewardedVideoFunnelChartConfig],
  },
];

export const immersiveVideoPageLayout: RAQIV2UIComponent[] = [
  {
    type: RAQIV2SpecialLayoutType.VerticalPriorityLayout,
    firstColumn: [chartConfigs.immersiveVideoEarningsChartConfig],
    secondColumn: [chartConfigs.immersiveVideoViewsChartConfig],
  },
];

export const immersiveImagePageLayout: RAQIV2UIComponent[] = [
  {
    type: RAQIV2SpecialLayoutType.FullWidthLayout,
    items: [chartConfigs.immersiveDisplayEarningsChartConfig],
  },
  {
    type: RAQIV2SpecialLayoutType.VerticalPriorityLayout,
    firstColumn: [chartConfigs.immersiveDisplayImpressionsChartConfig],
    secondColumn: [chartConfigs.immersiveDisplayEPMChartConfig],
  },
];

// Map of AnalyticsViewType to corresponding page layout
export const analyticsViewTypeToPageLayoutMap: Record<AnalyticsViewType, RAQIV2UIComponent[]> = {
  [AnalyticsViewType.Overview]: overviewPageLayout,
  [AnalyticsViewType.RewardedAds]: rewardedVideoPageLayout,
  [AnalyticsViewType.ManagedRewarded]: managedRewardedPageLayout,
  [AnalyticsViewType.VideoAds]: immersiveVideoPageLayout,
  [AnalyticsViewType.ImageAds]: immersiveImagePageLayout,
  [AnalyticsViewType.PortalAds]: portalsPageLayout,
};

export const viewTypeSpecificFilters: Record<AnalyticsViewType, RAQIV2Dimension[]> = {
  [AnalyticsViewType.Overview]: [RAQIV2Dimension.AdFormat],
  [AnalyticsViewType.RewardedAds]: [],
  [AnalyticsViewType.ManagedRewarded]: [],
  [AnalyticsViewType.VideoAds]: [],
  [AnalyticsViewType.ImageAds]: [],
  [AnalyticsViewType.PortalAds]: [],
};

export const viewTypeSpecificBreakdownDimensions: Record<AnalyticsViewType, RAQIV2Dimension[]> = {
  [AnalyticsViewType.Overview]: [RAQIV2Dimension.AdFormat, RAQIV2Dimension.AdInstanceName],
  [AnalyticsViewType.RewardedAds]: [RAQIV2Dimension.AdPlacementId],
  [AnalyticsViewType.ManagedRewarded]: [RAQIV2Dimension.AdPlacementId],
  [AnalyticsViewType.VideoAds]: [RAQIV2Dimension.AdInstanceName],
  [AnalyticsViewType.ImageAds]: [RAQIV2Dimension.AdInstanceName],
  [AnalyticsViewType.PortalAds]: [RAQIV2Dimension.AdInstanceName],
};

export const viewTypeDefaultBreakdownDimension: Record<AnalyticsViewType, TRAQIV2Dimension[]> = {
  [AnalyticsViewType.Overview]: [RAQIV2Dimension.AdFormat],
  [AnalyticsViewType.RewardedAds]: [],
  [AnalyticsViewType.ManagedRewarded]: [],
  [AnalyticsViewType.VideoAds]: [],
  [AnalyticsViewType.ImageAds]: [],
  [AnalyticsViewType.PortalAds]: [],
};

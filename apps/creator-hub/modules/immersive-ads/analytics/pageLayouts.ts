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
import managedRewardedChartConfigs from './configs/managedRewardedChartConfigs';
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

// Managed Rewarded page layout: Play with Reward placements. Unlike the rewarded
// video tab this is a short page — one summary row, earnings and impressions
// side by side, then CTR — and it carries no section titles.
//
// Two pieces of the design are missing because both key on the individual reward
// item, and the ads publisher reporting namespace exposes no reward dimension:
// the per-reward series on the CTR chart, and the "Top reward items" table. Both
// land with that dimension rather than ahead of it — the chart takes an
// `overrides.breakdown.override` on it, and the table is built and added here.
//
// The Video2D metrics behind this layout blend Play with Reward with
// in-experience rewarded video, so the tab is scoped by a page-level filter on
// the universe's Play with Reward placement ids, applied in
// `AnalyticsPageContentV2`. That filter applies to every panel here, which is why
// earnings and impressions can reuse the shared configs rather than needing
// Managed-Rewarded-specific copies. The layout stays behind
// `isManagedRewardedTabEnabled` until the reward dimension lands.
export const managedRewardedPageLayout: RAQIV2UIComponent[] = [
  {
    type: RAQIV2SpecialLayoutType.RowLayout,
    items: [
      cardConfigs.totalEarningsCardConfig,
      cardConfigs.totalImpressionsCardConfig,
      cardConfigs.ctrCardConfig,
    ],
  },
  {
    type: RAQIV2SpecialLayoutType.TwoPerRowLayout,
    items: [
      rewardedVideoChartConfigs.rewardedVideoEarningsChartConfig,
      rewardedVideoChartConfigs.rewardedVideoTotalImpressionsChartConfig,
    ],
    stackOnCompact: true,
  },
  {
    type: RAQIV2SpecialLayoutType.FullWidthLayout,
    items: [managedRewardedChartConfigs.managedRewardedCtrChartConfig],
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

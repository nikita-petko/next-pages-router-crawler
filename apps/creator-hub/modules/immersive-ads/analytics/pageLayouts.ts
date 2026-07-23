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

// Legacy rewarded video page layout: matches the layout currently on prod.
// Rendered when `isRewardedVideoRedesignEnabled` is OFF. Kept here verbatim
// so the feature flag can fall back to the existing UX while the redesign
// rolls out; once the flag reaches 100%, this constant and its callers can be
// removed alongside the legacy card/chart configs.
//
// The eDAU breakdown variants are always used since the legacy
// `isEdauBreakdownEnabled` setting is fully rolled out on prod. Non-breakdown
// variants are retained in the configs file but no longer referenced here.
export const rewardedVideoPageLayoutLegacy: RAQIV2UIComponent[] = [
  {
    type: RAQIV2SpecialLayoutType.RowLayout,
    items: [
      cardConfigs.impressionsPerEligibileDAUBreakdownCardConfig,
      cardConfigs.impressionsPerDailyUniqueViewersCardConfig,
      cardConfigs.fillRateCardConfig,
      cardConfigs.rewardedVideoConversionRateCardConfig,
    ],
  },
  {
    type: RAQIV2SpecialLayoutType.FullWidthLayout,
    items: [rewardedVideoChartConfigs.rewardedVideoRevenueRobuxChartConfig],
  },
  {
    type: RAQIV2SpecialLayoutType.VerticalPriorityLayout,
    firstColumn: [rewardedVideoChartConfigs.rewardedVideoTotalImpressionsChartConfig],
    secondColumn: [rewardedVideoChartConfigs.rewardedVideoEPMChartConfig],
  },
  {
    type: RAQIV2SpecialLayoutType.VerticalPriorityLayout,
    firstColumn: [rewardedVideoChartConfigs.rewardedVideoDailyUniqueViewerChartConfig],
    secondColumn: [
      rewardedVideoChartConfigs.rewardedVideoAverageEarningsPerDailyUniqueViewerChartConfig,
    ],
  },
  {
    type: RAQIV2SpecialLayoutType.VerticalPriorityLayout,
    firstColumn: [rewardedVideoChartConfigs.rewardedVideoEligibleDAUBreakdownChartConfig],
    secondColumn: [rewardedVideoChartConfigs.rewardedVideoReachPercentageBreakdownChartConfig],
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
  [AnalyticsViewType.VideoAds]: immersiveVideoPageLayout,
  [AnalyticsViewType.ImageAds]: immersiveImagePageLayout,
  [AnalyticsViewType.PortalAds]: portalsPageLayout,
};

export const viewTypeSpecificFilters: Record<AnalyticsViewType, RAQIV2Dimension[]> = {
  [AnalyticsViewType.Overview]: [RAQIV2Dimension.AdFormat],
  [AnalyticsViewType.RewardedAds]: [],
  [AnalyticsViewType.VideoAds]: [],
  [AnalyticsViewType.ImageAds]: [],
  [AnalyticsViewType.PortalAds]: [],
};

export const viewTypeSpecificBreakdownDimensions: Record<AnalyticsViewType, RAQIV2Dimension[]> = {
  [AnalyticsViewType.Overview]: [RAQIV2Dimension.AdFormat, RAQIV2Dimension.AdInstanceName],
  [AnalyticsViewType.RewardedAds]: [RAQIV2Dimension.AdPlacementId],
  [AnalyticsViewType.VideoAds]: [RAQIV2Dimension.AdInstanceName],
  [AnalyticsViewType.ImageAds]: [RAQIV2Dimension.AdInstanceName],
  [AnalyticsViewType.PortalAds]: [RAQIV2Dimension.AdInstanceName],
};

export const viewTypeDefaultBreakdownDimension: Record<AnalyticsViewType, TRAQIV2Dimension[]> = {
  [AnalyticsViewType.Overview]: [RAQIV2Dimension.AdFormat],
  [AnalyticsViewType.RewardedAds]: [],
  [AnalyticsViewType.VideoAds]: [],
  [AnalyticsViewType.ImageAds]: [],
  [AnalyticsViewType.PortalAds]: [],
};

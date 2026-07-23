import { RAQIV2SpecialLayoutType, RAQIV2UIComponent } from '@modules/experience-analytics-shared';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { TRAQIV2BreakdownDimension } from '@modules/clients/analytics/RAQIV2Dimension';
import chartConfigs from './configs/chartConfigs';
import { AnalyticsViewType } from './utils';
import rewardedVideoChartConfigs from './configs/rewardedVideoChartConfigs';
import cardConfigs from './configs/cardConfigs';

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

// Rewarded video page layout - supports dynamic eDAU breakdown feature flag
export const rewardedVideoPageLayout = (isEdauBreakdownEnabled = false): RAQIV2UIComponent[] => [
  {
    type: RAQIV2SpecialLayoutType.RowLayout,
    items: [
      isEdauBreakdownEnabled
        ? cardConfigs.impressionsPerEligibileDAUBreakdownCardConfig
        : cardConfigs.impressionsPerEligibileDAUCardConfig,
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
    firstColumn: [
      isEdauBreakdownEnabled
        ? rewardedVideoChartConfigs.rewardedVideoEligibleDAUBreakdownChartConfig
        : rewardedVideoChartConfigs.rewardedVideoEligibleDAUChartConfig,
    ],
    secondColumn: [
      isEdauBreakdownEnabled
        ? rewardedVideoChartConfigs.rewardedVideoReachPercentageBreakdownChartConfig
        : rewardedVideoChartConfigs.rewardedVideoReachPercentageChartConfig,
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
  [AnalyticsViewType.RewardedAds]: rewardedVideoPageLayout(),
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

export const viewTypeDefaultBreakdownDimension: Record<
  AnalyticsViewType,
  TRAQIV2BreakdownDimension[]
> = {
  [AnalyticsViewType.Overview]: [RAQIV2Dimension.AdFormat],
  [AnalyticsViewType.RewardedAds]: [],
  [AnalyticsViewType.VideoAds]: [],
  [AnalyticsViewType.ImageAds]: [],
  [AnalyticsViewType.PortalAds]: [],
};

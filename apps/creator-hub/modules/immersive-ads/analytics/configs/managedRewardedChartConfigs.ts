import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import type { ChartConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartConfig';
import { baseSplineChartConfigWithAverageSummary } from './baseConfigs';
import configConstants from './configConstants';

// Full-width CTR chart. Same metric as `ctrCardConfig` — impressions / fills —
// so the chart average matches the card above it.
//
// The design breaks this chart down by reward item, one series per reward. The
// ads publisher reporting namespace exposes no reward dimension, so it ships
// aggregate for now; adding the breakdown is an `overrides.breakdown.override`
// on that dimension once it exists, following `rewardedVideoFunnelChartConfig`.
//
// Play with Reward scoping is not an override here: it is a page-level filter on
// placement id, applied in `AnalyticsPageContentV2`. See
// `usePlayWithRewardPlacementIds` for why it cannot be a placement type filter.
const managedRewardedCtrChartConfig = {
  ...baseSplineChartConfigWithAverageSummary,
  titleKey: configConstants.ClickThroughRateTitleKey,
  definitionTooltipKey: configConstants.ClickThroughRateDescriptionKey,
  metric: RAQIV2Metric.AdsPublisherReportingVideo2DConversionRate,
} as const satisfies ChartConfig;

export default {
  managedRewardedCtrChartConfig,
};

import { ServerPaymentType } from '@constants/campaign';
import {
  CaaSReportingStatsResult,
  EntityPerformance,
  FrontendReportingStats,
  RawReportingMetric,
  RawReportingStats,
} from '@type/reportingStats';
import { MICRO_USD_IN_USD } from '@utils/currency';

interface FrontendReportingStatsGateState {
  appMetadataState?: {
    data?: {
      isFrontendReportingStatsEnabled?: boolean;
    };
  };
  shouldUseWorkspaceUniverseFiltering: () => boolean;
}

export const EMPTY_RAW_REPORTING_STATS: RawReportingStats = {
  clickCount: 0,
  fifteenSecVideoViewCount: 0,
  impressionCount: 0,
  playCount: 0,
  playTimeSeconds7d: 0,
  robuxRevenue30d: 0,
  spendMicroUsd: 0,
  twoSecVideoViewCount: 0,
};

export const shouldUseFrontendReportingStats = (state: FrontendReportingStatsGateState): boolean =>
  Boolean(state.appMetadataState?.data?.isFrontendReportingStatsEnabled) ||
  state.shouldUseWorkspaceUniverseFiltering();

const roundSpendUpToCentMicroUsd = (spendMicroUsd: number): number =>
  Math.ceil(spendMicroUsd / 10000) * 10000;

export const getDisplaySpendUsd = (spendMicroUsd: number): number =>
  roundSpendUpToCentMicroUsd(spendMicroUsd) / MICRO_USD_IN_USD;

const roundToOneDecimal = (value: number | undefined): number | undefined =>
  value === undefined ? undefined : Math.round((value + Number.EPSILON) * 10) / 10;

const divideWhenAvailable = (
  numerator: number,
  denominator: number,
  multiplier: number = 1,
): number | undefined => (denominator > 0 ? (numerator / denominator) * multiplier : undefined);

const hasFailed = (failedMetrics: RawReportingMetric[], metric: RawReportingMetric): boolean =>
  failedMetrics.includes(metric);

export const buildFrontendReportingStats = ({
  caas,
  paymentType,
}: {
  caas: CaaSReportingStatsResult;
  paymentType?: ServerPaymentType;
}): FrontendReportingStats => {
  const failedMetrics = [...caas.failedMetrics];
  const rawStats: RawReportingStats = { ...caas.stats };
  const roundedSpendMicroUsd = roundSpendUpToCentMicroUsd(rawStats.spendMicroUsd);
  const displaySpendUsd = getDisplaySpendUsd(rawStats.spendMicroUsd);

  const performance: EntityPerformance = {
    click_count: hasFailed(failedMetrics, 'clickCount') ? undefined : rawStats.clickCount,
    click_through_rate:
      hasFailed(failedMetrics, 'clickCount') || hasFailed(failedMetrics, 'impressionCount')
        ? undefined
        : roundToOneDecimal(
            divideWhenAvailable(rawStats.clickCount, rawStats.impressionCount, 100),
          ),
    cost_per_click_usd:
      hasFailed(failedMetrics, 'clickCount') || hasFailed(failedMetrics, 'spendMicroUsd')
        ? undefined
        : divideWhenAvailable(displaySpendUsd, rawStats.clickCount),
    cost_per_fifteen_sec_video_view_usd:
      hasFailed(failedMetrics, 'fifteenSecVideoViewCount') ||
      hasFailed(failedMetrics, 'spendMicroUsd')
        ? undefined
        : divideWhenAvailable(displaySpendUsd, rawStats.fifteenSecVideoViewCount),
    cost_per_millie_usd:
      hasFailed(failedMetrics, 'impressionCount') || hasFailed(failedMetrics, 'spendMicroUsd')
        ? undefined
        : divideWhenAvailable(displaySpendUsd, rawStats.impressionCount, 1000),
    cost_per_play_usd:
      hasFailed(failedMetrics, 'playCount') || hasFailed(failedMetrics, 'spendMicroUsd')
        ? undefined
        : divideWhenAvailable(displaySpendUsd, rawStats.playCount),
    display_spending_micro_usd: hasFailed(failedMetrics, 'spendMicroUsd')
      ? undefined
      : roundedSpendMicroUsd,
    display_spending_usd: hasFailed(failedMetrics, 'spendMicroUsd') ? undefined : displaySpendUsd,
    fifteen_sec_video_view_count: hasFailed(failedMetrics, 'fifteenSecVideoViewCount')
      ? undefined
      : rawStats.fifteenSecVideoViewCount,
    impression: hasFailed(failedMetrics, 'impressionCount') ? undefined : rawStats.impressionCount,
    payment_type: paymentType,
    play_count: hasFailed(failedMetrics, 'playCount') ? undefined : rawStats.playCount,
    play_rate:
      hasFailed(failedMetrics, 'playCount') || hasFailed(failedMetrics, 'impressionCount')
        ? undefined
        : divideWhenAvailable(rawStats.playCount, rawStats.impressionCount),
    roas:
      hasFailed(failedMetrics, 'robuxRevenue30d') || hasFailed(failedMetrics, 'roasSpendMicroUsd')
        ? undefined
        : divideWhenAvailable(rawStats.robuxRevenue30d, caas.roasSpendMicroUsd / MICRO_USD_IN_USD),
    spend_micro_usd: hasFailed(failedMetrics, 'spendMicroUsd') ? undefined : rawStats.spendMicroUsd,
    total_play_time_hours_7d: hasFailed(failedMetrics, 'playTimeSeconds7d')
      ? undefined
      : rawStats.playTimeSeconds7d / 3600,
    total_robux_revenue_30d: hasFailed(failedMetrics, 'robuxRevenue30d')
      ? undefined
      : rawStats.robuxRevenue30d,
    two_sec_video_view_count: hasFailed(failedMetrics, 'twoSecVideoViewCount')
      ? undefined
      : rawStats.twoSecVideoViewCount,
  };

  return { failedMetrics, performance, rawStats };
};

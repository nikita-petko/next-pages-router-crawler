import type { RobloxApiBillingModelsResponseGetEstimatedFiatResponse } from '@rbx/client-billing/v1';
/**
 * DevEx cash-out helpers for billing watermark balances and tier allocation.
 */

/** Treat null / undefined numeric API fields as 0. */
export function nullToZero(value: number | null | undefined): number {
  return value ?? 0;
}

export type NormalizedEstimatedFiat = {
  usdAmountMicro: number;
  usdAmountMicroFromWatermark: number;
  robuxAt35WatermarkRobux: number;
  robuxAt38WatermarkRobux: number;
  effectiveO18Robux: number;
  robuxAt35ToUsdRate: number;
  robuxAt38ToUsdRate: number;
  effectiveO18ToUsdRate: number;
  shouldDisplayEffectiveO18Robux: boolean;
  /**
   * Freshness of the watermark-derived balances (MIN of per-source last-processed timestamps from
   * `GetWatermarks`). Null when DevEx watermarks are disabled or the service did not return a value.
   */
  lastProcessedTimestamp: Date | null;
};

export function normalizeEstimatedFiatResponse(
  raw: RobloxApiBillingModelsResponseGetEstimatedFiatResponse,
): NormalizedEstimatedFiat {
  return {
    usdAmountMicro: nullToZero(raw.usdAmountMicro),
    usdAmountMicroFromWatermark: nullToZero(raw.usdAmountMicroFromWatermark),
    robuxAt35WatermarkRobux: nullToZero(raw.robuxAt35WatermarkRobux),
    robuxAt38WatermarkRobux: nullToZero(raw.robuxAt38WatermarkRobux),
    effectiveO18Robux: nullToZero(raw.effectiveO18Robux),
    robuxAt35ToUsdRate: nullToZero(raw.robuxAt35ToUsdRate),
    robuxAt38ToUsdRate: nullToZero(raw.robuxAt38ToUsdRate),
    effectiveO18ToUsdRate: nullToZero(raw.effectiveO18ToUsdRate),
    shouldDisplayEffectiveO18Robux: raw.shouldDisplayEffectiveO18Robux ?? false,
    lastProcessedTimestamp: raw.lastProcessedTimestamp ?? null,
  };
}

/**
 * O18 balance counts toward redemption only when the API allows showing effective O18
 * in the UI (`shouldDisplayEffectiveO18Robux`).
 */
export function effectiveO18BalanceForRedemption(norm: NormalizedEstimatedFiat): number {
  return norm.shouldDisplayEffectiveO18Robux ? norm.effectiveO18Robux : 0;
}

export type DevexWatermarkBucketKey = 'O18' | 'R35' | 'R38';

export type AllocatedDevexBucket = {
  key: DevexWatermarkBucketKey;
  robux: number;
  usd: number;
  rate: number;
};

export type DevexWatermarkAllocation = {
  buckets: AllocatedDevexBucket[];
  totalRobux: number;
  totalUsd: number;
};

/**
 * Redeem Robux from watermark buckets in order O18 → R35 → R38 up to `requestedRobux`.
 * O18 is only used when `shouldDisplayEffectiveO18Robux` is true; otherwise redemption starts at R35.
 */
export function allocateDevexWatermarkBuckets(
  requestedRobux: number,
  norm: NormalizedEstimatedFiat,
): DevexWatermarkAllocation {
  if (requestedRobux <= 0) {
    return { buckets: [], totalRobux: 0, totalUsd: 0 };
  }

  let remaining = requestedRobux;

  const tiers: Array<{ key: DevexWatermarkBucketKey; balance: number; rate: number }> = [
    {
      key: 'O18',
      balance: effectiveO18BalanceForRedemption(norm),
      rate: norm.effectiveO18ToUsdRate,
    },
    { key: 'R35', balance: norm.robuxAt35WatermarkRobux, rate: norm.robuxAt35ToUsdRate },
    {
      key: 'R38',
      balance: Math.max(
        0,
        requestedRobux - norm.robuxAt35WatermarkRobux - effectiveO18BalanceForRedemption(norm),
      ),
      rate: norm.robuxAt38ToUsdRate,
    },
  ];

  const buckets: AllocatedDevexBucket[] = [];
  for (const tier of tiers) {
    const take = Math.min(remaining, tier.balance);
    if (take > 0) {
      buckets.push({
        key: tier.key,
        robux: take,
        usd: take * tier.rate,
        rate: tier.rate,
      });
      remaining -= take;
    }
    if (remaining <= 0) {
      break;
    }
  }

  const totalRobux = buckets.reduce((sum, b) => sum + b.robux, 0);
  const totalUsd = buckets.reduce((sum, b) => sum + b.usd, 0);
  return { buckets, totalRobux, totalUsd };
}

/**
 * USD for the Robux amount helper: always the sum of tier allocation (`allocation.totalUsd`).
 */
export function resolveHeadlineUsdForRobuxAmount(
  requestedRobux: number,
  allocation: DevexWatermarkAllocation,
): number {
  if (requestedRobux <= 0) {
    return 0;
  }
  return allocation.totalUsd;
}

/** Formats USD per Robux rate for DevEx watermark tier copy (e.g. `$0.0035`). */
export function formatUsdPerRobuxRate(rate: number): string {
  return `$${rate.toFixed(4)}`;
}

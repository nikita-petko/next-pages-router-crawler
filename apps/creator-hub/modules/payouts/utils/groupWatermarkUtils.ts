import type { RobloxEconomyApiModelsGetDevExWatermarksResponse } from '@rbx/client-economy/v1';
import {
  type RobloxGroupsApiWatermarkContributionRequest,
  RobloxGroupsApiWatermarkContributionRequestBalanceKeyEnum,
} from '@rbx/client-groups/v1';
import type {
  NormalizedEstimatedFiat,
  DevexWatermarkAllocation,
  DevexWatermarkBucketKey,
} from '@modules/devex/global/cashOut/utils/devexWatermarkUtil';
import {
  nullToZero,
  allocateDevexWatermarkBuckets,
} from '@modules/devex/global/cashOut/utils/devexWatermarkUtil';
import { RATE_DIVISOR, MICRO_MULTIPLE } from '../constants/payoutsConstants';

function resolveBalanceType(balanceType: unknown): DevexWatermarkBucketKey | undefined {
  if (balanceType === 'R35' || balanceType === 0) {
    return 'R35';
  }
  if (balanceType === 'R38' || balanceType === 1) {
    return 'R38';
  }
  if (balanceType === 'O18' || balanceType === 2) {
    return 'O18';
  }
  return undefined;
}

export function normalizeGroupWatermarks(
  response: RobloxEconomyApiModelsGetDevExWatermarksResponse,
): NormalizedEstimatedFiat {
  let robuxAt35WatermarkRobux = 0;
  let robuxAt38WatermarkRobux = 0;
  let effectiveO18Robux = 0;
  let robuxAt35ToUsdRate = 0;
  let robuxAt38ToUsdRate = 0;
  let effectiveO18ToUsdRate = 0;

  for (const watermark of response.watermarks ?? []) {
    const amount = nullToZero(watermark.amount);
    const perRobuxRate = nullToZero(watermark.conversionRatePer10KRobux) / RATE_DIVISOR;
    const type = resolveBalanceType(watermark.balanceType);

    switch (type) {
      case 'R35':
        robuxAt35WatermarkRobux = amount;
        robuxAt35ToUsdRate = perRobuxRate;
        break;
      case 'R38':
        robuxAt38WatermarkRobux = amount;
        robuxAt38ToUsdRate = perRobuxRate;
        break;
      case 'O18':
        effectiveO18Robux = amount;
        effectiveO18ToUsdRate = perRobuxRate;
        break;
      case undefined:
        break;
    }
  }

  const totalUsd =
    effectiveO18Robux * effectiveO18ToUsdRate +
    robuxAt35WatermarkRobux * robuxAt35ToUsdRate +
    robuxAt38WatermarkRobux * robuxAt38ToUsdRate;

  return {
    usdAmountMicro: totalUsd * MICRO_MULTIPLE,
    usdAmountMicroFromWatermark: totalUsd * MICRO_MULTIPLE,
    robuxAt35WatermarkRobux,
    robuxAt38WatermarkRobux,
    effectiveO18Robux,
    robuxAt35ToUsdRate,
    robuxAt38ToUsdRate,
    effectiveO18ToUsdRate,
    shouldDisplayEffectiveO18Robux: response.shouldDisplayEffectiveO18Robux ?? false,
    // Freshness is only surfaced by the billing `estimated-fiat` endpoint; group watermarks omit it.
    lastProcessedTimestamp: null,
  };
}

export function allocatePayoutWatermarkBuckets(
  robux: number,
  normalizedWatermarks: NormalizedEstimatedFiat,
): DevexWatermarkAllocation {
  // R38 backfills any shortfall so payouts are never blocked by insufficient watermarks.
  const padded = {
    ...normalizedWatermarks,
    robuxAt38WatermarkRobux: Math.max(normalizedWatermarks.robuxAt38WatermarkRobux, robux),
  };
  return allocateDevexWatermarkBuckets(robux, padded);
}

export function buildWatermarkContributions(
  allocation: DevexWatermarkAllocation,
): RobloxGroupsApiWatermarkContributionRequest[] {
  const contributions: RobloxGroupsApiWatermarkContributionRequest[] = [];

  const o18Bucket = allocation.buckets.find((b) => b.key === 'O18');
  const standardAmount = allocation.buckets
    .filter((b) => b.key === 'R35' || b.key === 'R38')
    .reduce((sum, b) => sum + b.robux, 0);

  if (o18Bucket && o18Bucket.robux > 0) {
    contributions.push({
      balanceKey: RobloxGroupsApiWatermarkContributionRequestBalanceKeyEnum.NUMBER_2,
      amount: Math.round(o18Bucket.robux),
    });
  }

  if (standardAmount > 0) {
    contributions.push({
      balanceKey: RobloxGroupsApiWatermarkContributionRequestBalanceKeyEnum.NUMBER_1,
      amount: Math.round(standardAmount),
    });
  }

  return contributions;
}

export function applyWatermarkDebit(
  prev: NormalizedEstimatedFiat,
  allocation: DevexWatermarkAllocation,
): NormalizedEstimatedFiat {
  const o18Debit = allocation.buckets.find((b) => b.key === 'O18')?.robux ?? 0;
  const r35Debit = allocation.buckets.find((b) => b.key === 'R35')?.robux ?? 0;
  const r38Debit = allocation.buckets.find((b) => b.key === 'R38')?.robux ?? 0;

  const effectiveO18Robux = Math.max(0, prev.effectiveO18Robux - o18Debit);
  const robuxAt35WatermarkRobux = Math.max(0, prev.robuxAt35WatermarkRobux - r35Debit);
  const robuxAt38WatermarkRobux = Math.max(0, prev.robuxAt38WatermarkRobux - r38Debit);

  const totalUsd =
    effectiveO18Robux * prev.effectiveO18ToUsdRate +
    robuxAt35WatermarkRobux * prev.robuxAt35ToUsdRate +
    robuxAt38WatermarkRobux * prev.robuxAt38ToUsdRate;

  return {
    ...prev,
    effectiveO18Robux,
    robuxAt35WatermarkRobux,
    robuxAt38WatermarkRobux,
    usdAmountMicro: totalUsd * MICRO_MULTIPLE,
    usdAmountMicroFromWatermark: totalUsd * MICRO_MULTIPLE,
  };
}

export function computePerRecipientAllocations(
  payoutAmounts: number[],
  normalizedWatermarks: NormalizedEstimatedFiat,
): DevexWatermarkAllocation[] | undefined {
  const totalRobux = payoutAmounts.reduce((sum, amount) => sum + amount, 0);
  if (totalRobux <= 0) {
    return undefined;
  }

  const poolAllocation = allocatePayoutWatermarkBuckets(totalRobux, normalizedWatermarks);

  return payoutAmounts.map((amount) => {
    if (amount <= 0) {
      return { buckets: [], totalRobux: 0, totalUsd: 0 };
    }
    const proportion = amount / totalRobux;
    const buckets = poolAllocation.buckets.map((bucket) => ({
      ...bucket,
      robux: bucket.robux * proportion,
      usd: bucket.usd * proportion,
    }));
    return {
      buckets,
      totalRobux: amount,
      totalUsd: buckets.reduce((sum, b) => sum + b.usd, 0),
    };
  });
}

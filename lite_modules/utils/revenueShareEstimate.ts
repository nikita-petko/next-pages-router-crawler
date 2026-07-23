import { MS_PER_DAY } from '@constants/time';

// Source of truth for this tiered max-revenue-share computation is the backend:
//   ads-management-api: internal/controller/adintegrations/revenue_share_estimate.go
// The preview endpoint returns ONLY the raw signals (avg daily visits + weighted
// CPTV); the client computes the max locally from those signals plus the campaign
// duration. This file is intentionally a temporary THIRD copy of the formula
// (backend + this client) pending a shared computed value/endpoint that returns
// the max directly. Keep it byte-for-byte aligned with the Go implementation.

const VISITS_PER_CPTV_UNIT = 1000n;
const REVENUE_SHARE_BILLING_TIER_DAYS = 28;
const POST_TIER_CPTV_MICRO_USD = 100_000n;
const MAX_REVENUE_SHARE_BILLABLE_DAYS = 365;
const MICRO_USD_IN_USD = 1_000_000;

/**
 * Number of billable days between two epoch-ms timestamps, rounded up so any
 * partial day counts as a full billable day. Returns 0 when the range is empty
 * or inverted.
 */
export const computeBillableDays = (startMs: number, endMs: number): number => {
  if (endMs <= startMs) {
    return 0;
  }

  return Math.ceil((endMs - startMs) / MS_PER_DAY);
};

/**
 * Maximum revenue share (in micro-USD) for the given signals and duration.
 *
 * First `REVENUE_SHARE_BILLING_TIER_DAYS` billable days accrue at the weighted
 * CPTV; days 29..365 accrue at the flat post-tier CPTV. Beyond 365 days is
 * capped. Math is done in BigInt because the intermediate products can exceed
 * 2^53; a single floor division by `VISITS_PER_CPTV_UNIT` is applied at the end.
 */
export const computeMaxRevenueShareMicroUsd = (
  avgDailyVisits: number,
  weightedCptvMicroUsd: number,
  billableDays: number,
): number => {
  const days = Math.min(billableDays, MAX_REVENUE_SHARE_BILLABLE_DAYS);
  if (days <= 0) {
    return 0;
  }

  const tierDays = Math.min(days, REVENUE_SHARE_BILLING_TIER_DAYS);
  const tailDays = days - tierDays;

  const visits = BigInt(avgDailyVisits);
  const weightedCptv = BigInt(weightedCptvMicroUsd);

  const tier = visits * weightedCptv * BigInt(tierDays);
  const tail = visits * POST_TIER_CPTV_MICRO_USD * BigInt(tailDays);
  const total = (tier + tail) / VISITS_PER_CPTV_UNIT;

  return Number(total);
};

/**
 * Formats a micro-USD amount as a USD currency string (e.g. `$6,825.00`).
 */
export const formatMicroUsdToUsdDisplay = (microUsd: number): string =>
  (microUsd / MICRO_USD_IN_USD).toLocaleString('en-US', {
    currency: 'USD',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: 'currency',
  });

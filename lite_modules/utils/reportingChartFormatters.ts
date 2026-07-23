import { CampaignTimeSeriesDataPoints } from '@type/timeSeries';
import { MicroUsdToUsd } from '@utils/currency';

export type MetricValueFormatter = (value: number) => string;

export const formatTimestampLabel = (
  ts: number | string,
  locale: string | null,
  timezoneDbName: string,
): string => {
  const date = new Date(Number(ts));
  return date.toLocaleDateString(locale ?? undefined, {
    day: 'numeric',
    month: 'short',
    timeZone: timezoneDbName,
  });
};

export const sumPlaysFromTimeSeries = (
  plays: CampaignTimeSeriesDataPoints | undefined,
): number | undefined => {
  if (!plays) {
    return undefined;
  }

  return plays.reduce((sum, [, value]) => (value === null ? sum : sum + value), 0);
};

export const makePlaysValueFormatter =
  (locale: string | null): MetricValueFormatter =>
  (value) =>
    value.toLocaleString(locale ?? undefined);

// Matches the campaign-table ROAS cell: unitless ratio, 2 fraction digits, no "x".
export const makeRoasValueFormatter =
  (locale: string | null): MetricValueFormatter =>
  (value) =>
    value.toLocaleString(locale ?? undefined, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });

const sumNonNullValues = (points: CampaignTimeSeriesDataPoints): number =>
  points.reduce((sum, [, value]) => (value === null ? sum : sum + value), 0);

// Period-total ROAS: sum(revenue) / sum(spend USD). Prefer this over averaging
// daily ROAS so days with more spend weigh more. Undefined when spend/revenue
// are missing or total spend is <= 0 (matches AMSv2).
export const getTotalRoasFromTimeSeries = (
  spend: CampaignTimeSeriesDataPoints | undefined,
  revenue: CampaignTimeSeriesDataPoints | undefined,
): number | undefined => {
  if (!spend || !revenue) {
    return undefined;
  }

  const totalSpendMicroUsd = sumNonNullValues(spend);
  if (totalSpendMicroUsd <= 0) {
    return undefined;
  }

  return sumNonNullValues(revenue) / MicroUsdToUsd(totalSpendMicroUsd);
};

// Daily ROAS aligned with AMSv2 populateRoasOnCaaasMetrics:
// robux revenue / spend USD. Spend <= 0 → null (matches AMSv2).
export const getRoasMetric = (
  spend: CampaignTimeSeriesDataPoints,
  revenue: CampaignTimeSeriesDataPoints,
): CampaignTimeSeriesDataPoints => {
  const revenueByTimestamp = new Map(revenue);

  return spend.map(([timestamp, spendValue]): [number, number | null] => {
    const revenueValue = revenueByTimestamp.get(timestamp);

    if (
      spendValue === null ||
      spendValue <= 0 ||
      revenueValue === undefined ||
      revenueValue === null
    ) {
      return [timestamp, null];
    }

    return [timestamp, revenueValue / MicroUsdToUsd(spendValue)];
  });
};

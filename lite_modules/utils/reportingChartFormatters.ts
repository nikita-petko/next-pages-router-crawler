import { CampaignTimeSeriesDataPoints } from '@type/timeSeries';

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

export const makePercentValueFormatter =
  (locale: string | null): MetricValueFormatter =>
  (value) =>
    new Intl.NumberFormat(locale ?? undefined, {
      maximumFractionDigits: 2,
      style: 'percent',
    }).format(value / 100);

export const getRoasMetric = (
  spend: CampaignTimeSeriesDataPoints,
  revenue: CampaignTimeSeriesDataPoints,
): CampaignTimeSeriesDataPoints => {
  const revenueByTimestamp = new Map(revenue);

  return spend.map(([timestamp, spendValue]): [number, number | null] => {
    const revenueValue = revenueByTimestamp.get(timestamp);

    if (
      spendValue === null ||
      spendValue === 0 ||
      revenueValue === undefined ||
      revenueValue === null
    ) {
      return [timestamp, null];
    }

    return [timestamp, (revenueValue / spendValue) * 100];
  });
};

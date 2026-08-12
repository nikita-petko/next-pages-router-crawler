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

// Matches the campaign-table ROAS cell: unitless ratio, 2 fraction digits, no "x".
export const makeRoasValueFormatter =
  (locale: string | null): MetricValueFormatter =>
  (value) =>
    value.toLocaleString(locale ?? undefined, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });

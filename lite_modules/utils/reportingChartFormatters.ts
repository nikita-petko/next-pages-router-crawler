import { CampaignTimeSeriesDataPoints } from '@type/timeSeries';
import { ROAS_NUMBER_FORMAT_OPTIONS } from '@utils/reportingStats';

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

// Matches the campaign-table ROAS cell; shares ROAS_NUMBER_FORMAT_OPTIONS with
// REPORTING_STAT_ROAS. Locale is pluggable here so the drawer can honor the app
// locale, while the table stays hardcoded to 'en-US' via getStatString.
export const makeRoasValueFormatter =
  (locale: string | null): MetricValueFormatter =>
  (value) =>
    value.toLocaleString(locale ?? undefined, ROAS_NUMBER_FORMAT_OPTIONS);

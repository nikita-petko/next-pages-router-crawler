import type { FormattedText } from '@modules/analytics-translations/types';
import type { AnalyticsDataStatus, RAQIV2BreakdownValue } from '@modules/clients/analytics';

const enum SeriesTypes {
  Bar = 'bar',
  Map = 'map',
  Column = 'column',
}
export default SeriesTypes;

/**
 * A data point tuple containing timestamp, value, and optional data status.
 * The third element indicates the status of the data point (e.g., Valid, Projected, InProgress).
 * When not provided, status should be treated as Valid (the default).
 */
export type DataPoint<T, V> = [T, V | null] | [T, V | null, AnalyticsDataStatus | undefined];

export type GenericSeriesInfo<T, V> = {
  name: FormattedText;
  dataPoints: Array<DataPoint<T, V>>;
  breakdownValues: RAQIV2BreakdownValue[];
  isTotalSeries: boolean;
  isComparisonSeries?: boolean;
};

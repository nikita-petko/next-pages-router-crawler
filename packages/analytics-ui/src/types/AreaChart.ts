import type { ChartColor } from '../color';
import type { DataPoint, SeriesCustomMetaData } from './BaseChart';
import { SeriesDataTypes } from './BaseChart';

export const AreaSeriesDataTypes = [
  SeriesDataTypes.Normal,
  SeriesDataTypes.Total,
  SeriesDataTypes.Benchmark,
  SeriesDataTypes.Projection,
  SeriesDataTypes.Quota,
  SeriesDataTypes.Comparison,
] as const;

export type TAreaSeriesDataTypes = (typeof AreaSeriesDataTypes)[number];

export type SingleAreaSeries<X, Y> = {
  /** Optional series id */
  id?: string;
  name: string;
  dataPoints: Array<DataPoint<X, Y>>;
  type: TAreaSeriesDataTypes;
  custom?: SeriesCustomMetaData;
  color?: ChartColor;
};

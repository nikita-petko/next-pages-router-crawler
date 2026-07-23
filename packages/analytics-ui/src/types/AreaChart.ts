import { ChartColor } from '../color';
import { DataPoint, SeriesDataTypes, SeriesCustomMetaData } from './BaseChart';

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

export type ChartConstructorTypes = 'mapChart' | 'chart';

export enum ChartType {
  Spline = 'spline',
  Area = 'area',
  Column = 'column',
  Map = 'map',
  Bar = 'bar',
  Pie = 'pie',
  Treemap = 'treemap',
}

export enum ChartStyleMode {
  Normal = 'Normal',
  Minimal = 'Minimal',
}

/**
 * A data point tuple containing x value, y value, and optional metadata.
 * Past the second element, the tuple is extended with unknown types.
 */
export type DataPoint<X, Y> = [X, Y | null, ...Array<unknown>];

export enum XAxisGranularity {
  Month = 'month',
  Day = 'day',
  Minute = 'minute',
}

// NOTE(gperkins@ 20221025): Different data types have different styles
export enum SeriesDataTypes {
  Normal = 'Normal',
  /**
   * Generally shown the same as normal, except:
   * - In a stacked column chart, this is shown as a line
   * - In a stacked area chart, this is not shown
   */
  Total = 'Total',
  Benchmark = 'Benchmark',
  Projection = 'Projection',
  Quota = 'Quota',
  Comparison = 'Comparison',
  Scatter = 'Scatter',
  Noise = 'Noise',
}

// Note: highcharts supported custom properties
// We can add to this when a series needs to carry extra data for a formatter
// reference: https://api.highcharts.com/highcharts/series.line.custom
export type SeriesCustomMetaData = {
  imageUrl?: string;

  // for documentation only, line series specific metadata
  // seriesType?: SeriesDataTypes;
  // zone?: Array<{ start: number; end: number | null; type: SeriesDataTypes }>;
};

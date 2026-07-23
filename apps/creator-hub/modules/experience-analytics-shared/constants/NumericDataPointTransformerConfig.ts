import type {
  TimeSeriesDataPoint,
  Value,
} from '@modules/charts-generic/charts/types/TimeSeriesTypes';

export enum NumericDataPointTransformerType {
  PercentageOfFirstPoint = 'PercentageOfFirstPoint',
  ScaleBackBy100 = 'ScaleBackBy100',
  ScaleBackBy60 = 'ScaleBackBy60',
  ScaleBackBy3600 = 'ScaleBackBy3600',
  ScaleBackBy1000000000 = 'ScaleBackBy1000000000',
}

/**
 * Brand a computed number into the nominal `Value` type. The cast is unavoidable
 * for a number-brand; funnelling it through one helper keeps the unsafe
 * assertion in a single well-named location instead of scattering `as Value`.
 */
const toValue = (value: number): Value =>
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- branding a raw number into the Value nominal type
  value as Value;

function getScaleTransformer(scaleFactor: number) {
  return (index: number, dataPoints: TimeSeriesDataPoint[]): TimeSeriesDataPoint => {
    const dataPoint = dataPoints[index];
    const [timeStamp, value, status] = dataPoint;
    const newValue = value === null ? null : toValue(value * scaleFactor);
    return [timeStamp, newValue, status];
  };
}

type TDataPointTransformer = (
  index: number,
  dataPoints: TimeSeriesDataPoint[],
) => TimeSeriesDataPoint;

const NumericDataPointTransformerConfig: Record<
  NumericDataPointTransformerType,
  TDataPointTransformer
> = {
  [NumericDataPointTransformerType.PercentageOfFirstPoint]: (
    index: number,
    dataPoints: TimeSeriesDataPoint[],
  ): TimeSeriesDataPoint => {
    const [, firstPointValue] = dataPoints[0];
    const dataPoint = dataPoints[index];
    const [timeStamp, value, status] = dataPoint;

    let newValue: Value | null = null;
    if (firstPointValue && value !== null) {
      newValue = toValue(value / firstPointValue);
    }

    return [timeStamp, newValue, status];
  },
  [NumericDataPointTransformerType.ScaleBackBy100]: getScaleTransformer(1 / 100),
  [NumericDataPointTransformerType.ScaleBackBy60]: getScaleTransformer(1 / 60),
  [NumericDataPointTransformerType.ScaleBackBy3600]: getScaleTransformer(1 / 3600),
  [NumericDataPointTransformerType.ScaleBackBy1000000000]: getScaleTransformer(1 / 1000000000),
};

export default NumericDataPointTransformerConfig;

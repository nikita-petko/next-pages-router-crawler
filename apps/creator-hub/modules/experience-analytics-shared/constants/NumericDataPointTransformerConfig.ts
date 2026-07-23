import { TimeSeriesDataPoint, Value } from '@modules/charts-generic';

export enum NumericDataPointTransformerType {
  PercentageOfFirstPoint = 'PercentageOfFirstPoint',
  ScaleBackBy100 = 'ScaleBackBy100',
  ScaleBackBy60 = 'ScaleBackBy60',
  ScaleBackBy1000000000 = 'ScaleBackBy1000000000',
}

function getScaleTransformer(scaleFactor: number) {
  return (index: number, dataPoints: TimeSeriesDataPoint[]): TimeSeriesDataPoint => {
    const dataPoint = dataPoints[index];
    const [timeStamp, value, status] = dataPoint;
    const newValue = value === null ? null : ((value * scaleFactor) as Value);
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
      newValue = (value / firstPointValue) as Value;
    }

    return [timeStamp, newValue, status];
  },
  [NumericDataPointTransformerType.ScaleBackBy100]: getScaleTransformer(1 / 100),
  [NumericDataPointTransformerType.ScaleBackBy60]: getScaleTransformer(1 / 60),
  [NumericDataPointTransformerType.ScaleBackBy1000000000]: getScaleTransformer(1 / 1000000000),
};

export default NumericDataPointTransformerConfig;

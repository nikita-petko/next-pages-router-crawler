import { ChartType } from '@modules/charts-generic';
import { FC } from 'react';
import GenericRAQIV2ChartProps from '../../types/GenericRAQIV2ChartProps';
import GenericRAQIV2SplineChartV2 from './GenericRAQIV2SplineChartV2';
import GenericRAQIV2AreaChartV2 from './GenericRAQIV2AreaChartV2';
import GenericRAQIV2StackedColumnChartV2 from './GenericRAQIV2StackedColumnChartV2';
import GenericRAQIV2HorizontalBarChartV2 from './GenericRAQIV2HorizontalBarChartV2';
import GenericRAQIV2DurationSplineChartV2 from './GenericRAQIV2DurationSplineChartV2';
import GenericRAQIV2DurationAreaChartV2 from './GenericRAQIV2DurationAreaChartV2';
import GenericRAQIV2MapAndBarChartV2 from './GenericRAQIV2MapAndBarChartV2';
import GenericRAQIV2PieChartV2 from './GenericRAQIV2PieChartV2';

const chartTypeToGenericRAQIV2Chart = (
  chartType: Exclude<ChartType, ChartType.MultipleMetricSpline>,
): FC<GenericRAQIV2ChartProps> => {
  switch (chartType) {
    case ChartType.Spline:
      return GenericRAQIV2SplineChartV2;
    case ChartType.Area:
      return GenericRAQIV2AreaChartV2;
    case ChartType.Column:
      return GenericRAQIV2StackedColumnChartV2;
    case ChartType.Bar:
      return GenericRAQIV2HorizontalBarChartV2;
    case ChartType.Map:
      return GenericRAQIV2MapAndBarChartV2;
    case ChartType.DurationSpline:
      return GenericRAQIV2DurationSplineChartV2;
    case ChartType.DurationArea:
      return GenericRAQIV2DurationAreaChartV2;
    case ChartType.Pie:
      return GenericRAQIV2PieChartV2;
    default: {
      const exhaustiveCheck: never = chartType;
      throw new Error(`Unhandled chart type: ${exhaustiveCheck}`);
    }
  }
};

export default chartTypeToGenericRAQIV2Chart;

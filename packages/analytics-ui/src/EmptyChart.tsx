import type { FC } from 'react';
import React, { useMemo } from 'react';
import type { Options } from 'highcharts';
import { useTheme } from '@rbx/ui';
import { getChartThemedColors } from './color';
import GenericSeriesChart from './GenericSeriesChart';

const DefaultHeight = 360;

type EmptyChartProps = {
  height?: number;
};

const EmptyChart: FC<EmptyChartProps> = ({ height = DefaultHeight }) => {
  const theme = useTheme();
  const themedColors = useMemo(() => getChartThemedColors(theme), [theme]);

  const options: Options = useMemo(
    () => ({
      chart: {
        type: 'line',
        height,
        backgroundColor: 'transparent',
        style: { fontFamily: theme.typography.fontFamily },
        animation: false,
        showAxes: true,
      },
      title: { text: undefined },
      credits: { enabled: false },
      legend: { enabled: false },
      tooltip: { enabled: false },
      plotOptions: {
        series: {
          enableMouseTracking: false,
        },
      },
      xAxis: {
        min: 0,
        max: 1,
        showEmpty: true,
        lineColor: themedColors.axis,
        lineWidth: 1,
        tickLength: 0,
        labels: { enabled: false },
        gridLineWidth: 0,
      },
      yAxis: {
        min: 0,
        max: 1,
        showEmpty: true,
        gridLineColor: themedColors.gridLine,
        gridLineDashStyle: 'ShortDash',
        title: { text: undefined },
        labels: { enabled: false },
      },
      series: [{ type: 'line', data: [] }],
    }),
    [height, theme.typography.fontFamily, themedColors],
  );

  return <GenericSeriesChart options={options} />;
};

export default React.memo(EmptyChart);

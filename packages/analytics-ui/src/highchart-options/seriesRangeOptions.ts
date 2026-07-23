import { TTheme } from '@rbx/ui';
import {
  FormatterCallbackFunction,
  Point,
  PointOptionsObject,
  SeriesAreasplinerangeOptions,
} from 'highcharts';
import { LineRange } from '../types/LineChart';
import { getChartThemedColors } from '../color';

const buildSeriesRangeOptions = <X extends number, Y extends number, Tag>({
  range,
  theme,
  rangeFormatter,
}: {
  range: LineRange<X, Y, Tag>;
  theme: TTheme;
  rangeFormatter?: FormatterCallbackFunction<Point>;
}): SeriesAreasplinerangeOptions => {
  const { topDataPoints, bottomDataPoints, tags, id, name } = range;
  const data: PointOptionsObject[] = [];
  bottomDataPoints.forEach(([ts, bottomVal], idx) => {
    if (idx >= topDataPoints.length) {
      return;
    }
    const topVal = topDataPoints[idx]?.[1];
    const tagVal = tags?.[idx]?.[1];
    // NOTE(gperkins@ 20230303): reverse low & high to draw tooltip on upper line
    data.push({
      x: ts,
      low: topVal ?? undefined,
      high: bottomVal ?? undefined,
      custom: {
        tag: tagVal,
      },
    });
  });
  const rangeResult: SeriesAreasplinerangeOptions = {
    id,
    data,
    name,
    type: 'areasplinerange',
    lineWidth: 0,
    color: getChartThemedColors(theme).benchmarkLineColor,
    marker: { enabled: false, symbol: 'circle' },
    fillOpacity: 0.08,
    linkedTo: ':previous', // ensure they highlight together
    showInLegend: true,
    zIndex: 0,
    tooltip: {
      pointFormatter: rangeFormatter,
    },
  };

  return rangeResult;
};

export default buildSeriesRangeOptions;

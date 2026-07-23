import { makeStyles } from '@rbx/ui';
import Highcharts, {
  PointEventsOptionsObject,
  SeriesBarOptions,
  SeriesColumnOptions,
} from 'highcharts';
import { useCallback, useMemo } from 'react';

const useColumnDimmingOptionsStyles = makeStyles()(() => ({
  dimmedColumn: {
    opacity: 0.3,
  },
  dimmableColumnTransition: {
    transition: 'opacity 0.5s',
  },
}));

export const useColumnSeriesPointOptions = (): SeriesColumnOptions['point'] => {
  const {
    classes: { dimmedColumn, dimmableColumnTransition },
  } = useColumnDimmingOptionsStyles();

  const mouseOver = useCallback<NonNullable<PointEventsOptionsObject['mouseOver']>>(
    (event) => {
      const { target } = event;
      if (target instanceof Highcharts.Point) {
        target.series.chart.series.forEach((columnSeries) => {
          // NOTE(shumingxu, 05/07/2024): If the chart unmount while the mouse is over,
          // columnSeries will be undefined. Typescript doesn't capture this behavior unfortunately.
          columnSeries?.points?.forEach((point) => {
            point.graphic?.addClass(dimmableColumnTransition, true);
            if (point.x === target.x) {
              // do not dim current column
              point.graphic?.removeClass(dimmedColumn);
            } else {
              point.graphic?.addClass(dimmedColumn, false);
            }
          });
        });
      }
    },
    [dimmableColumnTransition, dimmedColumn],
  );

  const mouseOut = useCallback<NonNullable<PointEventsOptionsObject['mouseOut']>>(
    (event) => {
      const { target } = event;
      if (target instanceof Highcharts.Point) {
        target.series.chart.series.forEach((columnSeries) => {
          // NOTE(shumingxu, 05/07/2024): See mouseOver.
          columnSeries?.points?.forEach((point) => {
            point.graphic?.removeClass(dimmedColumn);
          });
        });
      }
    },
    [dimmedColumn],
  );

  return useMemo(
    () => ({
      events: {
        mouseOver,
        mouseOut,
      },
    }),
    [mouseOut, mouseOver],
  );
};

export const useBarSeriesPointOptions: () => SeriesBarOptions['point'] =
  useColumnSeriesPointOptions;

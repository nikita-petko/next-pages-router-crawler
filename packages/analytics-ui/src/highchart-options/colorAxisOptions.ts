import { useTheme } from '@rbx/ui';
import { ColorAxisOptions, AxisLabelsFormatterContextObject } from 'highcharts';
import { useCallback, useMemo } from 'react';
import { getTextStyleFromTheme } from '../utils/getTextStyleFromTheme';
import { getTreemapColorStops } from '../color';

const useMapChartColorAxisOptions = ({ splits }: { splits: number[] }): ColorAxisOptions => {
  return useMemo(() => {
    const dataClasses = [];
    for (let idx = 0; idx <= splits.length; idx += 1) {
      const from = idx === 0 ? undefined : splits[idx - 1];
      const to = idx === splits.length ? undefined : splits[idx];
      dataClasses.push({ from, to });
    }

    return {
      dataClasses,
    };
  }, [splits]);
};

export const useTreemapColorAxisOptions = (): ColorAxisOptions => {
  const theme = useTheme();

  const colorAxisLabelsFormatter = useCallback(function formatter(
    this: AxisLabelsFormatterContextObject,
  ) {
    const { value } = this;
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
      return '';
    }
    return `${Math.round(numericValue * 100)}%`;
  }, []);

  return useMemo(
    () => ({
      min: 0,
      max: 1,
      stops: getTreemapColorStops(theme),
      labels: {
        style: {
          color: theme.palette.content.standard,
          ...getTextStyleFromTheme(theme, 'body2'),
        },
        formatter: colorAxisLabelsFormatter,
      },
      width: 512,
      minPadding: 2,
      tickAmount: 5,
    }),
    [colorAxisLabelsFormatter, theme],
  );
};
export default useMapChartColorAxisOptions;

import { TTheme, useTheme } from '@rbx/ui';
import { TooltipOptions, Point } from 'highcharts';
import { useCallback, useMemo } from 'react';
import { getChartThemedColors } from '../color';
import {
  MapSeriesPointFormatter,
  PieSliceFormatter,
  useBarChartTooltipFormatter,
  useColumnChartTooltipFormatter,
  useLineChartTooltipFormatter,
  useMapChartTooltipFormatter,
  usePieChartTooltipPointFormatter,
  useTooltipContainerStyle,
  highchartsSkipTooltipToken,
} from '../formatters/tooltipFormatters';

const getBaseOptions = ({ theme }: { theme: TTheme }): TooltipOptions => {
  const { tooltipText } = getChartThemedColors(theme);
  return {
    snap: 0,

    /**
     * We need to set the background color to transparent to create an illusion that point tooltips,
     * when rendered separatly, to have some gap between them. This is done by making the background
     * transparent and with some padding. Then we assign the real 'tooltip background' when formatting
     * each point tooltip. (see ../formatters/tooltipFormatters.ts)
     */
    split: true,
    shared: false,
    backgroundColor: 'transparent',
    padding: 2,

    borderWidth: 0,
    distance: 26,
    style: {
      color: tooltipText,
      /** NOTE(gperkins@20240618): Highcharts hardcoded default is 3
       * but the modal zIndex (which we need to be above) is currently 1300
       */
      zIndex: theme.zIndex.modal + 1,
    },
    useHTML: true,
    shape: 'rect',
    headerShape: 'rect',
    hideDelay: 0,
    outside: true,
  };
};

export const useLineChartTooltipOptions = ({
  formatX,
}: {
  formatX: (x: string | number) => string;
}): TooltipOptions => {
  const theme = useTheme();

  const tooltipFormatter = useLineChartTooltipFormatter({
    formatX,
  });

  return useMemo(
    () => ({
      ...getBaseOptions({ theme }),
      formatter: tooltipFormatter,
    }),
    [theme, tooltipFormatter],
  );
};

export const useAreaChartTooltipOptions = useLineChartTooltipOptions;

export const useColumnChartTooltipOptions = ({
  formatX,
}: {
  formatX: (x: string | number) => string;
}) => {
  const theme = useTheme();

  const tooltipFormatter = useColumnChartTooltipFormatter({
    formatX,
  });

  return useMemo(
    () => ({
      ...getBaseOptions({ theme }),
      formatter: tooltipFormatter,
    }),
    [theme, tooltipFormatter],
  );
};

export const useBarChartTooltipOptions = (): TooltipOptions => {
  const theme = useTheme();

  // bar chart doesn't show x for tooltip
  const formatX = useCallback(() => '', []);

  const formatter = useBarChartTooltipFormatter({
    formatX,
  });

  return useMemo(
    () => ({
      ...getBaseOptions({ theme }),
      formatter,
    }),
    [formatter, theme],
  );
};

export const useMapChartTooltipOptions = (formatPoint: MapSeriesPointFormatter): TooltipOptions => {
  const theme = useTheme();

  const formatter = useMapChartTooltipFormatter({ formatPoint });

  return useMemo(
    () => ({
      ...getBaseOptions({ theme }),
      formatter,
    }),
    [formatter, theme],
  );
};

export const usePieChartTooltipOptions = <SliceName extends string, Y extends number>({
  formatSeriesKeyForSlice,
  formatSeriesValueForSlice,
}: {
  formatSeriesKeyForSlice: PieSliceFormatter<SliceName, Y>;
  formatSeriesValueForSlice: PieSliceFormatter<SliceName, Y>;
}): TooltipOptions => {
  const theme = useTheme();
  const tooltipBackgroundStyle = useTooltipContainerStyle();

  const pointFormatter = usePieChartTooltipPointFormatter({
    formatSeriesKeyForSlice,
    formatSeriesValueForSlice,
  });

  const formatter = useCallback(
    function tooltipFormatter(this: Point) {
      if (!this.name || this.y == null || this.percentage == null) {
        return highchartsSkipTooltipToken;
      }

      const formattedContent = pointFormatter.call(this);

      if (formattedContent === highchartsSkipTooltipToken) {
        return formattedContent;
      }

      return `<div style="${tooltipBackgroundStyle}">${formattedContent}</div>`;
    },
    [pointFormatter, tooltipBackgroundStyle],
  );

  return useMemo(
    () => ({
      ...getBaseOptions({ theme }),
      split: false,
      formatter,
    }),
    [theme, formatter],
  );
};

export type TreemapTooltipFormatter = (context: {
  name: string;
  value: number;
  percentage?: number;
  custom?: Record<string, unknown>;
}) => string;

export const useTreemapTooltipOptions = (
  formatTooltip: TreemapTooltipFormatter,
): TooltipOptions => {
  const theme = useTheme();
  const tooltipBackgroundStyle = useTooltipContainerStyle();

  const formatter = useCallback(
    function tooltipFormatter(this: Point & { series: { tree?: { val?: number } } }) {
      const { value: pointValue, series, name, options } = this;
      const rootTotal = series.tree?.val;
      const value = pointValue ?? 0;
      // Calculate percentage based on root total if available
      const percentage = rootTotal && rootTotal > 0 ? value / rootTotal : undefined;
      const formattedContent = formatTooltip({
        name: name ?? '',
        value,
        percentage,
        custom: options?.custom as Record<string, unknown> | undefined,
      });

      return `<div style="${tooltipBackgroundStyle}">${formattedContent}</div>`;
    },
    [formatTooltip, tooltipBackgroundStyle],
  );

  return useMemo(
    () => ({
      ...getBaseOptions({ theme }),
      split: false,
      formatter,
    }),
    [theme, formatter],
  );
};

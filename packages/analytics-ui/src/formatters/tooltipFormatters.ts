import type {
  FormatterCallbackFunction,
  Point,
  Tooltip,
  TooltipFormatterCallbackFunction,
} from 'highcharts';
import Highcharts from 'highcharts';
import { useCallback } from 'react';
import type { TTheme } from '@rbx/ui';
import { useMediaQuery, useTheme } from '@rbx/ui';
import { getChartThemedColors } from '../color';
import { SeriesDataTypes } from '../types/BaseChart';
import type { LineChartZones } from '../types/LineChart';
import { escapeHtmlFn, escapeHtmlString } from '../utils/escape-html';
import UnicodeTokensForChartFormatters from './unicodeTokensForChartFormatters';

export const highchartsSkipTooltipToken = '';

enum ViewPortSize {
  Small,
  Medium,
  Large,
}

const MaxCharactersFromFormattedKeyByViewPortSize: Record<ViewPortSize, number> = {
  [ViewPortSize.Small]: 30,
  [ViewPortSize.Medium]: 34,
  [ViewPortSize.Large]: 42,
};

type PointFormatterCommonFields = {
  seriesId?: string;
  seriesType?: SeriesDataTypes;
  zones?: LineChartZones;
};

export type SeriesKeyForPointFormatter<X extends string | number> = (
  fields: PointFormatterCommonFields & {
    seriesName: string;
    x: X;
  },
) => string;

export type SeriesValueForPointFormatter<Y extends number> = (
  fields: PointFormatterCommonFields & {
    y: Y;
  },
) => string;

const CHIP_TOKEN_REGEX = /__chip\(([^)]+)\)__/g;

/**
 * Decorate a tooltip series name with a chip badge using special syntax
 * @param seriesName - The base series name text
 * @param chipLabel - The label to display in the chip badge
 * @returns Series name with chip syntax appended
 * @example decorateTooltipSeriesName("Series Name", "Noisy") => "Series Name__chip(Noisy)__"
 */
export const decorateTooltipSeriesName = (seriesName: string, chipLabel: string): string => {
  return `${seriesName}__chip(${chipLabel})__`;
};

/**
 * Parse special chip syntax in text and convert to HTML badges
 * Syntax: __chip(label)__ becomes a styled badge
 */
const parseChipSyntax = (text: string): string => {
  const chipStyle =
    'display:inline-block;background-color:#696A6D;color:#FFFFFF;font-size:12px;font-weight:600;padding:2px 6px;border-radius:4px;margin-left:4px;vertical-align:baseline;';
  return text.replace(CHIP_TOKEN_REGEX, (_, label) => {
    return `<span style="${chipStyle}">${label}</span>`;
  });
};

/**
 * @description export for testing only
 */
export const perSeriesHTML = ({
  key,
  value,
  shouldRenderDot,
  theme,
  imageUrl,
  color,
}: {
  key: string;
  value: string;
  shouldRenderDot: boolean;
  theme: TTheme;
  imageUrl?: string;
  color?: Point['color'];
}) => {
  const shouldUseHollowBulletPoint =
    getChartThemedColors(theme).tooltipBackground === color?.toString();
  // render a hollowed bullet point if series color is the same as background
  const dotStyle = shouldUseHollowBulletPoint ? '' : `color:${color?.toString()};`;
  const bulletPointUnicode = shouldUseHollowBulletPoint
    ? UnicodeTokensForChartFormatters.HollowBulletPoint
    : UnicodeTokensForChartFormatters.BulletPoint;
  const dot = `<span style="${dotStyle}">${bulletPointUnicode}${UnicodeTokensForChartFormatters.WhiteSpace}</span>`;

  const imageStyle =
    'width: 56px; height: 32px; vertical-align: middle; border: 4px solid white; border-radius: 4px;';
  const image = `<img src="${imageUrl}" alt="" style="${imageStyle}"/>`;

  // use image as key if imageUrl is provided
  const keyStyle = `font-weight: 600;`;
  const formattedKey = `<span style="${keyStyle}">${shouldRenderDot ? dot : ''}${imageUrl ? image : key}</span>`;

  const formattedValue = `<span>${value}</span>`;

  const containerStyle = `display:inline-flex;justify-content:space-between;flex-grow:1;font-size:11px;width:100%;align-items:center;`;
  return `<div><span style="${containerStyle}">${formattedKey}${UnicodeTokensForChartFormatters.FigureSpace}${formattedValue}</span></div>`;
};

export const usePerSeriesTooltipPointFormatter = <X extends string | number, Y extends number>({
  formatSeriesKeyForPoint,
  formatSeriesValueForPoint,
}: {
  formatSeriesKeyForPoint: SeriesKeyForPointFormatter<X>;
  formatSeriesValueForPoint: SeriesValueForPointFormatter<Y>;
}): FormatterCallbackFunction<Point> => {
  const inSmallViewPort = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const inMediumViewPort = useMediaQuery((theme) => theme.breakpoints.down('Large'));
  const inLargeViewPort = useMediaQuery((theme) => theme.breakpoints.down('XLarge'));
  const theme = useTheme();

  return useCallback(
    function perSeriesFormatter(this: Point) {
      const { x, y, color, series, name } = this;
      if (y === null || y === undefined) {
        return highchartsSkipTooltipToken;
      }

      const { custom, id } = series.userOptions;
      const imageUrl: string | undefined = Highcharts.defined(custom?.imageUrl)
        ? custom?.imageUrl
        : undefined;

      const seriesType: SeriesDataTypes | undefined = Highcharts.defined(custom?.seriesType)
        ? custom?.seriesType
        : undefined;

      const zones: LineChartZones | undefined = custom?.zones;

      // Do not render dot if there's only one series in the chart
      const firstSeriesWithDataPoint = series.chart.series.find((s) => s.data.length > 0);
      const lastSeriesWithDataPoint = [...series.chart.series]
        .toReversed()
        .find((s) => s.data.length > 0);
      const shouldRenderDot = firstSeriesWithDataPoint !== lastSeriesWithDataPoint;

      const formattedKey = escapeHtmlFn(formatSeriesKeyForPoint)({
        seriesName: series.name,
        seriesType,
        x: (name ?? x) as X,
        seriesId: id,
        zones,
      });

      // Sometimes there are really long series name, we need to truncate it so that tooltip
      // doesn't get too wide and gets cutoff from the screen
      let maxCharacters = formattedKey.length;
      if (inSmallViewPort) {
        maxCharacters = MaxCharactersFromFormattedKeyByViewPortSize[ViewPortSize.Small];
      } else if (inMediumViewPort) {
        maxCharacters = MaxCharactersFromFormattedKeyByViewPortSize[ViewPortSize.Medium];
      } else if (inLargeViewPort) {
        maxCharacters = MaxCharactersFromFormattedKeyByViewPortSize[ViewPortSize.Large];
      }

      const chipTokens: string[] = [];
      const textPart = formattedKey.replace(CHIP_TOKEN_REGEX, (match) => {
        chipTokens.push(match);
        return '';
      });

      const truncatedText =
        textPart.length > maxCharacters ? `${textPart.slice(0, maxCharacters)}...` : textPart;

      const keyWithChips = truncatedText + chipTokens.join('');
      const finalKey = parseChipSyntax(keyWithChips);

      return perSeriesHTML({
        key: finalKey,
        value: escapeHtmlFn(formatSeriesValueForPoint)({
          y: y as Y,
          seriesType,
          seriesId: id,
          zones,
        }),
        theme,
        color,
        imageUrl,
        shouldRenderDot,
      });
    },
    [
      formatSeriesKeyForPoint,
      formatSeriesValueForPoint,
      inLargeViewPort,
      inMediumViewPort,
      inSmallViewPort,
      theme,
    ],
  );
};

export type RangePointFormatterFn<RangeTag, X> = ({
  top,
  bottom,
  tag,
  x,
}: {
  top: number;
  bottom: number;
  tag?: RangeTag;
  x: X;
}) => {
  rangeKey?: string;
  rangeValue: string;
};

export const getRangePointFormatter = <RangeTag, X>({
  formatRange,
}: {
  formatRange: RangePointFormatterFn<RangeTag, X>;
}): FormatterCallbackFunction<Point> => {
  function tooltipFormatter(this: Point & { low?: number; high?: number }) {
    const { low: top, high: bottom, options, x } = this;
    if (top === undefined || bottom === undefined) {
      return highchartsSkipTooltipToken;
    }

    const { rangeKey, rangeValue } = formatRange({
      top,
      bottom,
      tag: options.custom?.tag,
      x: x as X,
    });

    return `<div style="font-weight:600;">${escapeHtmlString(rangeKey ?? '')}</div>${escapeHtmlString(
      rangeValue,
    )}`;
  }
  return tooltipFormatter;
};

const maxNumberOfPerSeriesTooltip = 11;

export const useTooltipContainerStyle = () => {
  const theme = useTheme();
  const { tooltipBackground } = getChartThemedColors(theme);
  const style = `background-color:${tooltipBackground};border-radius:4px;padding-top:4px;padding-bottom:4px;padding-left:6px;padding-right:6px;line-height:1.6;`;
  return style;
};

export const useLineChartTooltipFormatter = ({
  formatX,
}: {
  formatX: (x: string | number) => string;
}): TooltipFormatterCallbackFunction => {
  const tooltipBackgroundStyle = useTooltipContainerStyle();
  const inLargeViewPort = useMediaQuery((theme) => theme.breakpoints.up('Medium'));

  // LineChart tooltip is rendered in two moodes - shared and non-shared
  // 1. shared mode - when there are more than 6 categories in the chart. Render all per series tooltip in
  //    in a shared tooltip container with two columns.
  // 2. non-shared mode - when there are less than 6 categories in the chart. Render each per-series tooltip
  //    in a separate tooltip container.
  // Notice if view port(not chart size) is small, always render in non-shared mode. This is because shared tooltip
  // container can occupy a relative large area which obstructs the chart in small view port.

  return useCallback(
    function tooltipFormatter(this: Point, tooltip: Tooltip) {
      const { x } = this;
      const points = tooltip.chart.hoverPoints ?? undefined;

      // 1. Identify the number of categories in the chart
      const numberOfCategories =
        points?.filter((point: Point) => {
          const seriesType = point.series.userOptions.custom?.seriesType;
          return seriesType === SeriesDataTypes.Total || seriesType === SeriesDataTypes.Normal;
        }).length ?? 0;
      const shouldRenderPerSeriesTooltipInOneCallout = inLargeViewPort && numberOfCategories > 6;

      // 2. If it should render in shared tooltip, sort the points by y value so that they are not jumbled in
      //    shared tooltip container.
      let tooltipFormatterContext = { ...this, points };
      if (shouldRenderPerSeriesTooltipInOneCallout && points?.length) {
        const sortedPoints = [...points].sort((a: Point, b: Point) => {
          if (a.y == null && b.y == null) {
            return 0;
          }
          if (a.y != null && b.y != null) {
            return b.y - a.y;
          }
          return a.y == null ? 1 : -1;
        });
        tooltipFormatterContext = {
          ...tooltipFormatterContext,
          points: sortedPoints,
        };
      }

      // 3. call tooltip.defaultFormatter to get per-Series formatted tooltip
      const currentFormattedTooltips = tooltip.defaultFormatter
        .call(tooltipFormatterContext, tooltip)
        .slice(0, maxNumberOfPerSeriesTooltip);

      if (Array.isArray(currentFormattedTooltips)) {
        const formattedX = x === undefined ? highchartsSkipTooltipToken : escapeHtmlFn(formatX)(x);
        const formattedXWithBackground = formattedX
          ? `<div style="${tooltipBackgroundStyle}">${formattedX}</div>`
          : formattedX;
        const [, ...tooltipWithoutX] = currentFormattedTooltips;

        if (!shouldRenderPerSeriesTooltipInOneCallout) {
          return [
            formattedXWithBackground,
            ...tooltipWithoutX
              .filter(Boolean)
              .map((t) => `<div style="${tooltipBackgroundStyle}">${t}</div>`),
          ];
        }

        const boundary = Math.floor(tooltipWithoutX.length / 2);
        const firstColumn = `<div>${tooltipWithoutX.slice(0, boundary).join('')}</div>`;
        const secondColumn = `<div>${tooltipWithoutX.slice(boundary).join('')}</div>`;

        return [
          formattedXWithBackground,
          `<div style="display:flex;column-gap:8px;${tooltipBackgroundStyle}">${firstColumn}${secondColumn}</div>`,
        ];
      }

      return currentFormattedTooltips;
    },
    [formatX, inLargeViewPort, tooltipBackgroundStyle],
  );
};

export const useColumnChartTooltipFormatter = ({
  formatX,
}: {
  formatX: (x: string | number) => string;
}): TooltipFormatterCallbackFunction => {
  const tooltipBackgroundStyle = useTooltipContainerStyle();
  const inLargeViewPort = useMediaQuery((theme) => theme.breakpoints.up('Medium'));

  // ColumnChart tooltip is also rendered in two moodes - shared and non-shared (see LineChart tooltip for details)
  // The difference is that 'Total' series tooltip is always on top.

  return useCallback(
    function tooltipFormatter(this: Point, tooltip: Tooltip) {
      const { x } = this;
      const points = tooltip.chart.hoverPoints ?? undefined;

      // 1. Check if we should render tooltip in shared tooltip container
      const numberOfCategories = points?.length ?? 0;
      const shouldRenderPerSeriesTooltipInOneCallout = inLargeViewPort && numberOfCategories > 6;

      // 2. Pull 'Total' point on top
      let sortedPoints = points;
      if (points?.length) {
        sortedPoints = [...points].sort((a: Point, b: Point) => {
          const seriesTypeA = a.series.options.custom?.seriesType;
          const seriesTypeB = b.series.options.custom?.seriesType;
          if (seriesTypeA === seriesTypeB) {
            return 0;
          }
          if (seriesTypeA === SeriesDataTypes.Total) {
            return -1;
          }
          return 1;
        });
      }

      // 3. call tooltip.defaultFormatter to get per-Series formatted tooltip
      const tooltipFormatterContext = { ...this, points: sortedPoints };
      const currentFormattedTooltips = tooltip.defaultFormatter
        .call(tooltipFormatterContext, tooltip)
        .slice(0, maxNumberOfPerSeriesTooltip);

      if (Array.isArray(currentFormattedTooltips)) {
        const formattedX = x === undefined ? highchartsSkipTooltipToken : escapeHtmlFn(formatX)(x);
        const formattedXWithBackground = formattedX
          ? `<div style="${tooltipBackgroundStyle}">${formattedX}</div>`
          : formattedX;

        const [, ...tooltipWithoutX] = currentFormattedTooltips;

        if (!shouldRenderPerSeriesTooltipInOneCallout) {
          return [
            formattedXWithBackground,
            ...tooltipWithoutX
              .filter(Boolean)
              .map((t) => `<div style="${tooltipBackgroundStyle}">${t}</div>`),
          ];
        }

        const boundary = Math.ceil(tooltipWithoutX.length / 2);
        const firstColumn = `<div>${tooltipWithoutX.slice(0, boundary).join('')}</div>`;
        const secondColumn = `<div>${tooltipWithoutX.slice(boundary).join('')}</div>`;

        return [
          formattedXWithBackground,
          `<div style="display:flex;column-gap:8px;${tooltipBackgroundStyle}">${firstColumn}${secondColumn}</div>`,
        ];
      }

      return currentFormattedTooltips;
    },
    [formatX, inLargeViewPort, tooltipBackgroundStyle],
  );
};

export const useBarChartTooltipFormatter = useColumnChartTooltipFormatter;

export type MapSeriesPointFormatter = ({
  hcKey,
  seriesName,
}: {
  hcKey: string;
  seriesName: string;
}) => string;

export const useMapChartTooltipFormatter = ({
  formatPoint,
}: {
  formatPoint: MapSeriesPointFormatter;
}): TooltipFormatterCallbackFunction => {
  const tooltipBackgroundStyle = useTooltipContainerStyle();

  return useCallback(
    function tooltipFormatter(this: Point & { 'hc-key'?: string; value?: number | null }) {
      const { series, 'hc-key': hcKey, value } = this;

      if (value === null || value === undefined || hcKey === undefined) {
        return highchartsSkipTooltipToken;
      }

      return `<div style="${tooltipBackgroundStyle}">${escapeHtmlFn(formatPoint)({
        hcKey,
        seriesName: series.name,
      })}</div>`;
    },
    [formatPoint, tooltipBackgroundStyle],
  );
};

export type PieSliceFormatter<SliceName extends string, Y extends number> = ({
  sliceName,
  sliceValue,
  percentage,
}: {
  sliceName: SliceName;
  sliceValue: Y;
  percentage: number;
}) => string;

export const usePieChartTooltipPointFormatter = <SliceName extends string, Y extends number>({
  formatSeriesKeyForSlice,
  formatSeriesValueForSlice,
}: {
  formatSeriesKeyForSlice: PieSliceFormatter<SliceName, Y>;
  formatSeriesValueForSlice: PieSliceFormatter<SliceName, Y>;
}): FormatterCallbackFunction<Point> => {
  const theme = useTheme();

  return useCallback(
    function pieSliceFormatter(this: Point) {
      const { name, y, percentage, color } = this;
      if (!name || y == null || percentage == null) {
        return highchartsSkipTooltipToken;
      }

      const formattedKey = escapeHtmlFn(formatSeriesKeyForSlice)({
        sliceName: name as SliceName,
        sliceValue: y as Y,
        percentage,
      });

      const formattedValue = escapeHtmlFn(formatSeriesValueForSlice)({
        sliceName: name as SliceName,
        sliceValue: y as Y,
        percentage,
      });

      return perSeriesHTML({
        key: formattedKey,
        value: formattedValue,
        shouldRenderDot: true, // Always show dot for pie slices
        theme,
        color,
      });
    },
    [formatSeriesKeyForSlice, formatSeriesValueForSlice, theme],
  );
};

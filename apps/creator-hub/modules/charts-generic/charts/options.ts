import { ChartStyleMode } from '@rbx/analytics-ui';
import type { TTheme } from '@rbx/ui';

export const chartDefaultHeight = 450;

type TChartThemedColors = {
  background: string;
  layoutBackground: string;
  highlightBackground: string;
  axis: string;
  axisValueText: string;
  summaryText: string;
  legendText: string;
  dataLabelText: string;
  benchmarkLineColor: string;
  columnTotalSeriesLineColor: string;
  annotationBackground: string;
  annotationBorder: string;
  annotationText: string;
  tooltipBackground: string;
  tooltipText: string;
  benchmarkMarkLabelBackground: string;
  annotationVerticalLine: string;
};

// TODO(creator-hub): this duplicates `getChartThemedColors` in
// `@rbx/analytics-ui/src/color.ts`. The two should be deduplicated — they share
// many keys (axis, axisValueText, legendText, dataLabelText, benchmarkLineColor,
// columnTotalSeriesLineColor, tooltipBackground, tooltipText, annotationVerticalLine)
// but each has a few unique fields (this one adds background / layoutBackground /
// highlightBackground / summaryText / annotation* / benchmarkMarkLabelBackground;
// analytics-ui adds gridLine / comparisonLineColor / zoneLegendSymbol /
// annotationVerticalRange). Keep the two in sync when touching either.
export const getChartThemedColors = (theme: TTheme): TChartThemedColors => {
  const isDarkTheme = theme.palette.mode === 'dark';
  const annotationColors = {
    annotationBackground: theme.palette.common.white,
    annotationBorder: theme.palette.content.static.dark,
    annotationVerticalLine: isDarkTheme ? theme.palette.common.white : theme.palette.common.black,
    annotationText: theme.palette.actionV2.primaryBrand.fill,
  };

  return {
    background: theme.palette.surface[100],
    layoutBackground: theme.palette.surface[0],
    highlightBackground: theme.palette.actionV2.primaryBrand.fill,
    axis: theme.palette.content.disabled,
    axisValueText: theme.palette.content.muted,
    summaryText: theme.palette.content.standard,
    legendText: theme.palette.content.standard,
    dataLabelText: theme.palette.content.standard,
    benchmarkLineColor: theme.palette.content.standard,
    columnTotalSeriesLineColor: theme.palette.content.standard,
    // Inverse tooltip pattern (Foundation convention): tooltips render in the
    // opposite theme of the page they sit on, so a light page gets a dark
    // tooltip and a dark page gets a light tooltip. Using content.standard
    // for the background and content.inverse for the text naturally inverts.
    tooltipText: theme.palette.content.inverse,
    tooltipBackground: theme.palette.content.standard,
    benchmarkMarkLabelBackground: theme.palette.surface[400],
    ...annotationColors,
  };
};

export const getChartDefaultHeightByMode = (chartStyleMode: ChartStyleMode): number => {
  switch (chartStyleMode) {
    case ChartStyleMode.Minimal:
      return 72;
    case ChartStyleMode.Normal:
      return chartDefaultHeight;
    default: {
      const exhaustiveCheck: string = chartStyleMode;
      throw new Error(`Unrecognized chartStyleMode ${exhaustiveCheck}.`);
    }
  }
};

// INFO(cmccarty@20230616) These params are deffs part of shapes, highcharts just doesn't have it in their type def for some reason
export interface ExtendedAnnotationsShapesOptions extends Highcharts.AnnotationsShapesOptions {
  x: number;
  y: number;
}

export enum TableCellBackgroundColor {
  Positive = 'Positive',
  Negative = 'Negative',
  Progression = 'Progression',
  Highlight = 'Highlight',
}

/**
 * Parses an `rgb(r, g, b)` or `#rrggbb` color string into the bare `"r, g, b"`
 * tuple form needed for `rgba(${tuple}, ${opacity})` construction. Returns the
 * input unchanged if the format isn't recognized (e.g. already-bare tuples, or
 * tokens that resolve to `rgba()` / named colors).
 */
const toRgbTuple = (color: string): string => {
  const rgbMatch = color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  if (rgbMatch) {
    return `${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}`;
  }
  const hexMatch = color.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (hexMatch) {
    return `${parseInt(hexMatch[1], 16)}, ${parseInt(hexMatch[2], 16)}, ${parseInt(hexMatch[3], 16)}`;
  }
  return color;
};

/**
 * Resolves the RGB tuple for a table cell background tint, sourced from
 * semantic design tokens rather than hardcoded hex strings. Returns the bare
 * `"r, g, b"` form so callers can apply variable opacity via `rgba()`.
 *
 * NOTE: switching from hardcoded chart palette values to semantic tokens means
 * the cell tints shift slightly to match the design system's success / alert /
 * brand colors. The most visible shift is for `Negative`, which moves from the
 * older muted red (#E05B52) to the system alert red (~#DF281F). If that proves
 * too vivid at 40% opacity, swap to `actionV2.important.containedHoverFocus`
 * (which is `Extended.Red.Red_700`, an exact match for the historical value)
 * but be aware that's the hover/focus stroke variant, not a fill semantic.
 */
export const getTableCellBackgroundRgbTuple = (
  color: TableCellBackgroundColor,
  theme: TTheme,
): string => {
  switch (color) {
    case TableCellBackgroundColor.Positive:
      return toRgbTuple(theme.palette.actionV2.active.fill);
    case TableCellBackgroundColor.Negative:
      return toRgbTuple(theme.palette.actionV2.important.fill);
    case TableCellBackgroundColor.Progression:
      return toRgbTuple(theme.palette.actionV2.primaryBrand.fill);
    case TableCellBackgroundColor.Highlight:
      return toRgbTuple(theme.palette.surface[100]);
    default: {
      const exhaustiveCheck: never = color;
      throw new Error(`Unhandled TableCellBackgroundColor: ${exhaustiveCheck as string}`);
    }
  }
};

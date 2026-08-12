import { useCallback } from 'react';
import type {
  FormatterCallbackFunction,
  Point,
  Tooltip,
  TooltipFormatterCallbackFunction,
} from 'highcharts';
import type { TTheme } from '@rbx/ui';
import { useMediaQuery, useTheme } from '@rbx/ui';
import { getChartThemedColors } from '../color';
import { SeriesDataTypes } from '../types/BaseChart';
import type { LineChartZones } from '../types/LineChart';
import { escapeHtmlFn, escapeHtmlString } from '../utils/escape-html';
import sanitizeImageUrl from '../utils/sanitize-url';
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

/**
 * Reinterprets a value Highcharts hands us (typed as `any`, `string | number`,
 * or similar) as the concrete type the caller declared via a generic parameter.
 *
 * These formatters are generic over the x/y/slice types purely so callers can
 * describe their own data; Highcharts itself has no knowledge of those types
 * and cannot validate them. Declaring the type is therefore part of the API
 * contract with the caller, not an unchecked guess about runtime shape, so the
 * assertion is confined to this one reviewed helper instead of being repeated
 * at every call site.
 */
// eslint-disable-next-line typescript/no-unsafe-type-assertion -- see above
const asCallerDeclared = <T>(value: unknown): T => value as T;

/**
 * Highcharts types `series.userOptions.custom` as `Record<string, any>`, so
 * reading fields off it spreads `any` through the formatters. Narrow it once,
 * here, and validate the fields we actually depend on.
 */
type SeriesCustomFields = {
  imageUrl?: string;
  seriesType?: SeriesDataTypes;
  zones?: LineChartZones;
};

const SERIES_DATA_TYPE_VALUES: ReadonlySet<unknown> = new Set(Object.values(SeriesDataTypes));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isSeriesDataType = (value: unknown): value is SeriesDataTypes =>
  SERIES_DATA_TYPE_VALUES.has(value);

const readSeriesCustomFields = (custom: unknown): SeriesCustomFields => {
  if (!isRecord(custom)) {
    return {};
  }

  const { imageUrl, seriesType, zones } = custom;
  return {
    imageUrl: typeof imageUrl === 'string' ? imageUrl : undefined,
    seriesType: isSeriesDataType(seriesType) ? seriesType : undefined,
    // `zones` is a structural array the chart adapters build; an element-level
    // check would duplicate the type for no practical benefit.
    zones: Array.isArray(zones) ? (zones as LineChartZones) : undefined,
  };
};

// Matches `__chip(label)__` markers injected by `decorateTooltipSeriesName`.
// The label is delimited by `[^)]+`, which means chip labels themselves cannot
// contain `)` — a call like `decorateTooltipSeriesName('Series', 'foo)bar')`
// will round-trip as literal text, not as a badge. Callers that need a
// user-controlled chip label should pre-strip parentheses. (This constraint
// is intentional: it also prevents pathological inputs like
// `__chip(<img src=x onerror=alert(1))>__` from tricking the splitter.)
const CHIP_TOKEN_REGEX = /__chip\(([^)]+)\)__/g;

const CHIP_STYLE =
  'display:inline-block;background-color:#696A6D;color:#FFFFFF;font-size:12px;font-weight:600;padding:2px 6px;border-radius:4px;margin-left:4px;vertical-align:baseline;';

type KeySegment = { kind: 'text'; value: string } | { kind: 'chip'; label: string };

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
 * Split a raw (unescaped) formatted-key string into an ordered list of text
 * and chip segments based on `__chip(label)__` markers.
 *
 * Returning segments (rather than a single string) lets the caller escape and
 * truncate each kind independently, so the final HTML is safe regardless of
 * what the upstream formatter produced.
 */
const splitKeyIntoSegments = (rawKey: string): KeySegment[] => {
  const segments: KeySegment[] = [];
  let cursor = 0;
  const regex = new RegExp(CHIP_TOKEN_REGEX.source, 'g');
  let match: RegExpExecArray | null = regex.exec(rawKey);
  while (match !== null) {
    if (match.index > cursor) {
      segments.push({ kind: 'text', value: rawKey.slice(cursor, match.index) });
    }
    segments.push({ kind: 'chip', label: match[1] });
    cursor = match.index + match[0].length;
    match = regex.exec(rawKey);
  }
  if (cursor < rawKey.length) {
    segments.push({ kind: 'text', value: rawKey.slice(cursor) });
  }
  return segments;
};

/**
 * Assemble the final (HTML-safe) key HTML from a raw formatted-key string.
 *
 * - Text segments are truncated against their raw character length (so
 *   truncation math is not thrown off by HTML entities) and then escaped.
 * - Chip labels are always rendered (truncation never drops chips) and are
 *   escaped at the point they are interpolated into the badge HTML. This
 *   makes the function safe regardless of whether the caller pre-escaped.
 */
const buildEscapedKeyWithChips = (rawKey: string, maxTextCharacters: number): string => {
  const segments = splitKeyIntoSegments(rawKey);
  let remaining = maxTextCharacters;
  let truncationApplied = false;
  const parts: string[] = [];

  for (const segment of segments) {
    if (segment.kind === 'chip') {
      parts.push(`<span style="${CHIP_STYLE}">${escapeHtmlString(segment.label)}</span>`);
    } else if (!truncationApplied && remaining > 0) {
      if (segment.value.length <= remaining) {
        parts.push(escapeHtmlString(segment.value));
        remaining -= segment.value.length;
      } else {
        parts.push(`${escapeHtmlString(segment.value.slice(0, remaining))}...`);
        remaining = 0;
        truncationApplied = true;
      }
    }
    // Trailing text segments after truncation are dropped.
  }

  return parts.join('');
};

/**
 * Builds the per-series tooltip HTML.
 *
 * @description Export for testing only.
 *
 * `key` and `value` must already be HTML-escaped. `key` may also contain the
 * trusted chip `<span>` markup produced by `buildEscapedKeyWithChips`, so
 * escaping them here would both be too late for safety and break chip
 * rendering. Escape dynamic values before calling this function.
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
  // `Point['color']` may also be a gradient or pattern object, which would
  // stringify to `[object Object]`. Only a plain color string is usable here.
  const colorString = typeof color === 'string' ? color : undefined;
  const shouldUseHollowBulletPoint = getChartThemedColors(theme).tooltipBackground === colorString;
  // render a hollowed bullet point if series color is the same as background
  const dotStyle = shouldUseHollowBulletPoint ? '' : `color:${colorString};`;
  const bulletPointUnicode = shouldUseHollowBulletPoint
    ? UnicodeTokensForChartFormatters.HollowBulletPoint
    : UnicodeTokensForChartFormatters.BulletPoint;
  const dot = `<span style="${dotStyle}">${bulletPointUnicode}${UnicodeTokensForChartFormatters.WhiteSpace}</span>`;

  const imageStyle =
    'width: 56px; height: 32px; vertical-align: middle; border: 4px solid white; border-radius: 4px;';
  const safeImageUrl = sanitizeImageUrl(imageUrl);
  const image = safeImageUrl ? `<img src="${safeImageUrl}" alt="" style="${imageStyle}"/>` : '';

  // use image as key if a safe imageUrl is provided
  const keyStyle = `font-weight: 600;`;
  const formattedKey = `<span style="${keyStyle}">${shouldRenderDot ? dot : ''}${image || key}</span>`;

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
      const { imageUrl, seriesType, zones } = readSeriesCustomFields(custom);

      // Do not render dot if there's only one series in the chart
      const firstSeriesWithDataPoint = series.chart.series.find((s) => s.data.length > 0);
      const lastSeriesWithDataPoint = [...series.chart.series]
        .toReversed()
        .find((s) => s.data.length > 0);
      const shouldRenderDot = firstSeriesWithDataPoint !== lastSeriesWithDataPoint;

      // NOTE: we intentionally do NOT escape the formatter output up front.
      // `buildEscapedKeyWithChips` splits the string into text and chip
      // segments and escapes each one at the point it is assembled into HTML.
      // This keeps XSS safety local to the segment builder and makes
      // truncation operate on real character counts (not HTML entities).
      const rawKey = formatSeriesKeyForPoint({
        seriesName: series.name,
        seriesType,
        x: asCallerDeclared<X>(name ?? x),
        seriesId: id,
        zones,
      });

      // Sometimes there are really long series name, we need to truncate it so that tooltip
      // doesn't get too wide and gets cutoff from the screen
      let maxTextCharacters = Number.POSITIVE_INFINITY;
      if (inSmallViewPort) {
        maxTextCharacters = MaxCharactersFromFormattedKeyByViewPortSize[ViewPortSize.Small];
      } else if (inMediumViewPort) {
        maxTextCharacters = MaxCharactersFromFormattedKeyByViewPortSize[ViewPortSize.Medium];
      } else if (inLargeViewPort) {
        maxTextCharacters = MaxCharactersFromFormattedKeyByViewPortSize[ViewPortSize.Large];
      }

      const finalKey = buildEscapedKeyWithChips(rawKey, maxTextCharacters);

      return perSeriesHTML({
        key: finalKey,
        value: escapeHtmlFn(formatSeriesValueForPoint)({
          y: asCallerDeclared<Y>(y),
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
      tag: asCallerDeclared<RangeTag | undefined>(options.custom?.tag),
      x: asCallerDeclared<X>(x),
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
          const { seriesType } = readSeriesCustomFields(point.series.userOptions.custom);
          return seriesType === SeriesDataTypes.Total || seriesType === SeriesDataTypes.Normal;
        }).length ?? 0;
      const shouldRenderPerSeriesTooltipInOneCallout = inLargeViewPort && numberOfCategories > 6;

      // 2. If it should render in shared tooltip, sort the points by y value so that they are not jumbled in
      //    shared tooltip container.
      // `defaultFormatter` only reads own data properties off its `this`, so the
      // dropped `Point` prototype is intentional here; preserving it would change
      // what Highcharts sees.
      // eslint-disable-next-line typescript/no-misused-spread -- see above
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
          const { seriesType: seriesTypeA } = readSeriesCustomFields(a.series.options.custom);
          const { seriesType: seriesTypeB } = readSeriesCustomFields(b.series.options.custom);
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
      // See the note in `useLineChartTooltipFormatter`: dropping the `Point`
      // prototype is intentional for the `defaultFormatter` context object.
      // eslint-disable-next-line typescript/no-misused-spread -- see above
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
        sliceName: asCallerDeclared<SliceName>(name),
        sliceValue: asCallerDeclared<Y>(y),
        percentage,
      });

      const formattedValue = escapeHtmlFn(formatSeriesValueForSlice)({
        sliceName: asCallerDeclared<SliceName>(name),
        sliceValue: asCallerDeclared<Y>(y),
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

import { measureNaturalWidth, prepareWithSegments } from '@chenglou/pretext';

export type AdaptiveDataTableTextStyle = {
  readonly font: string;
  readonly horizontalPadding: number;
  readonly letterSpacing: number;
};

export type AdaptiveDataTableTextStyles = {
  readonly cell: AdaptiveDataTableTextStyle;
  readonly header: AdaptiveDataTableTextStyle;
};

const MaximumCachedMeasurements = 1_000;
const measuredWidthCache = new Map<string, number>();

const canMeasureText = (): boolean =>
  typeof Intl.Segmenter === 'function' &&
  (typeof OffscreenCanvas !== 'undefined' || typeof CanvasRenderingContext2D !== 'undefined');

/**
 * Measures a single line using the browser's text shaping engine through Pretext. Returning
 * undefined lets the table preserve its SSR and unsupported-browser width estimate.
 */
export const measureAdaptiveDataTableText = (
  text: string,
  style: AdaptiveDataTableTextStyle,
): number | undefined => {
  if (!canMeasureText()) {
    return undefined;
  }

  const cacheKey = `${style.font}\u0000${style.letterSpacing}\u0000${text}`;
  const cachedWidth = measuredWidthCache.get(cacheKey);
  if (cachedWidth !== undefined) {
    return cachedWidth;
  }

  try {
    const width = measureNaturalWidth(
      prepareWithSegments(text, style.font, { letterSpacing: style.letterSpacing }),
    );
    if (measuredWidthCache.size >= MaximumCachedMeasurements) {
      measuredWidthCache.clear();
    }
    measuredWidthCache.set(cacheKey, width);
    return width;
  } catch {
    return undefined;
  }
};

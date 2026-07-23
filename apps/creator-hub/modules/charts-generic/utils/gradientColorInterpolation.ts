/**
 * Utility functions for interpolating colors in a gradient
 */

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

interface PercentileRange {
  min: number;
  max: number;
}

interface SegmentGradientColors {
  startColor: string;
  endColor: string;
}

/**
 * Validates if a string is a valid hex color
 */
const isValidHexColor = (hex: string): boolean => {
  return /^#?([a-f\d]{3}|[a-f\d]{6})$/i.test(hex);
};

/**
 * Converts a hex color to RGB values
 */
const hexToRgb = (hex: string): RgbColor => {
  if (!isValidHexColor(hex)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  const cleanHex = hex.replace('#', '');
  const fullHex =
    cleanHex.length === 3
      ? cleanHex
          .split('')
          .map((char) => char + char)
          .join('')
      : cleanHex;

  return {
    r: parseInt(fullHex.slice(0, 2), 16),
    g: parseInt(fullHex.slice(2, 4), 16),
    b: parseInt(fullHex.slice(4, 6), 16),
  };
};

/**
 * Converts RGB values to hex color
 */
const rgbToHex = (rgb: RgbColor): string => {
  const toHex = (n: number): string => {
    const clamped = Math.round(Math.max(0, Math.min(255, n)));
    const hex = clamped.toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
};

/**
 * Interpolates between two RGB colors
 */
const interpolateRgb = (color1: RgbColor, color2: RgbColor, fraction: number): RgbColor => {
  const clampedFraction = Math.max(0, Math.min(1, fraction));

  return {
    r: color1.r + (color2.r - color1.r) * clampedFraction,
    g: color1.g + (color2.g - color1.g) * clampedFraction,
    b: color1.b + (color2.b - color1.b) * clampedFraction,
  };
};

/**
 * Interpolates a color from a gradient array based on position
 */
export const interpolateGradientColor = (colors: string[], position: number): string => {
  if (colors.length === 0) return '#000000';
  if (colors.length === 1) return colors[0];

  const clampedPosition = Math.max(0, Math.min(1, position));
  if (clampedPosition === 0) return colors[0];
  if (clampedPosition === 1) return colors[colors.length - 1];

  const scaledPosition = clampedPosition * (colors.length - 1);
  const index = Math.floor(scaledPosition);
  const fraction = scaledPosition - index;

  try {
    const color1 = hexToRgb(colors[index]);
    const color2 = hexToRgb(colors[index + 1]);
    const interpolatedRgb = interpolateRgb(color1, color2, fraction);
    return rgbToHex(interpolatedRgb);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to interpolate gradient color: ${errorMessage}`);
  }
};

/**
 * Gets the gradient color at a specific percentile position
 */
export const getGradientColorAtPercentile = (
  gradientColors: string[],
  percentile: number,
): string => {
  const clampedPercentile = Math.max(0, Math.min(100, percentile));
  const position = clampedPercentile / 100;
  return interpolateGradientColor(gradientColors, position);
};

/**
 * Calculates the gradient colors for a specific segment based on its percentile range
 */
export const getSegmentGradientColors = (
  gradientColors: string[],
  segmentPercentileRange: PercentileRange,
): SegmentGradientColors => {
  const { min, max } = segmentPercentileRange;
  const startColor = interpolateGradientColor(gradientColors, min / 100);
  const endColor = interpolateGradientColor(gradientColors, max / 100);
  return { startColor, endColor };
};

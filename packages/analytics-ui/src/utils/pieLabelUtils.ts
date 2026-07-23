import type { Point, Chart } from 'highcharts';
import { escapeHtmlString } from './escape-html';
import measureTextWidth from './textMeasurement';

export const PIE_LABEL_DISTANCE_PERCENTAGE = 30; // Labels positioned at -30% from edge

export const getPieLabelFontSize = (chartWidth: number, chartHeight: number): number => {
  const chartSize = Math.min(chartWidth, chartHeight);
  if (chartSize >= 400) {
    return 14; // Medium screens
  }
  if (chartSize >= 300) {
    return 12; // Small screens
  }
  return 10; // Very small screens
};

export interface TextMeasurer {
  measureText: (text: string, fontSize: number, fontFamily?: string) => number;
}

export const defaultTextMeasurer: TextMeasurer = {
  measureText: measureTextWidth,
};

export const canPieLabelFit = (
  point: Point,
  chart: Chart,
  formattedText: string | number,
  fontSize: number,
  borderWidth: number = 0,
  textMeasurer: TextMeasurer = defaultTextMeasurer,
): boolean => {
  if (!point || !point.y || !point.percentage || !chart || !formattedText) {
    return false;
  }

  // Calculate available space for text at the label distance
  const { plotWidth, plotHeight } = chart;

  // Base pie radius is half the smaller dimension of the chart plot area
  const basePieRadius = Math.min(plotWidth, plotHeight) * 0.5;

  // Labels are positioned at -30% from the edge, so they're closer to center
  // This creates a smaller radius where labels are placed
  const labelRadius = basePieRadius * (1 - PIE_LABEL_DISTANCE_PERCENTAGE / 100);

  // Calculate the angle of this slice in radians
  // point.percentage is the percentage of the total pie this slice represents
  // Convert percentage to radians: (percentage/100) * 2π
  const sliceAngleRad = (point.percentage / 100) * 2 * Math.PI;

  // Calculate available width for text at the label radius
  // This is the chord length at the label radius, which represents the maximum
  // horizontal space available for text within this slice
  // Formula: 2 * radius * sin(angle/2) gives chord length
  const availableWidth = labelRadius * Math.sin(sliceAngleRad / 2) * 1;

  // Account for border width - borders take up space and reduce available width
  const borderSpace = borderWidth * 2; // Border on both sides of the slice
  const availableWidthWithBorder = availableWidth - borderSpace;

  // Use the provided font size for calculations
  const effectiveFontSize = Math.max(8, Math.min(20, fontSize));

  // Calculate actual text width using the provided text measurer
  const textContent = escapeHtmlString(String(formattedText));
  const estimatedTextWidth = textMeasurer.measureText(textContent, effectiveFontSize);

  return estimatedTextWidth <= availableWidthWithBorder;
};

// Defines deterministic colors for managing-group, recipient, and unallocated revenue share chart segments.
import { ChartColor } from '@rbx/analytics-ui';

export const MANAGING_GROUP_COLOR = '#00A2FF';
export const AGGREGATE_REMAINING_COLOR = 'var(--color-extended-gray-600)';

export const MANAGING_GROUP_CHART_COLOR = ChartColor.Blue;
export const AGGREGATE_REMAINING_CHART_COLOR = ChartColor.Blue3;

export const RECIPIENT_CHART_COLORS = [
  ChartColor.Purple2,
  ChartColor.Green,
  ChartColor.Orange,
  ChartColor.Yellow2,
  ChartColor.Red,
  ChartColor.Purple,
  ChartColor.Cyan,
  ChartColor.Blue2,
  ChartColor.Green2,
  ChartColor.Purple3,
  ChartColor.Yellow,
  ChartColor.Yellow3,
  ChartColor.Green3,
  ChartColor.Cyan2,
  ChartColor.Purple4,
] as const;

export const UNALLOCATED_COLOR = 'var(--color-surface-300)';
export const UNALLOCATED_CHART_COLOR = ChartColor.White;

export const getRecipientChartColorByIndex = (index: number): ChartColor =>
  RECIPIENT_CHART_COLORS[index % RECIPIENT_CHART_COLORS.length];

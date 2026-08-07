import type {
  RAQIV2DateRangeType,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import type { FormattedText } from '@modules/analytics-translations/types';
import type { TFormattingSpec } from './FormattingSpec';

export enum ChartType {
  Spline = 'spline',
  Area = 'area',
  Column = 'column',
  Map = 'map',
  Bar = 'bar',
  Pie = 'pie',
  DurationSpline = 'duration_spline',
  DurationArea = 'duration_area',
  MultipleMetricSpline = 'multiple_metric_spline',
  Table = 'Table',
}

export type ChartUnitFormatted = {
  formattingSpec?: TFormattingSpec;
  display: FormattedText;
};
export type GenericChartState = {
  isDataLoading: boolean;
  isResponseFailed: boolean;
  isUserForbidden: boolean;
  error?: Error | null;
};
export type ChartEventLoggers = {
  impressionLogger: () => void;
  hoverImpressionLogger: () => void;
};

export type TExplicitTimeRangeSpec = {
  /**
   * The RAQIV2DateRangeType the resolved start/end window came from (relative
   * preset like Last7Days, or `Custom` for explicit bounds).
   */
  rangeType: RAQIV2DateRangeType;
  startTime: Date;
  endTime: Date;
  /**
   * snapGranularity is used for aligning the start & end time (explicit or from rangeType).
   * If not provided, snapping behavior will be determined by the chart's granularity.
   */
  snapGranularity?: RAQIV2MetricGranularity;
};

export type TLabeledExplicitTimeRangeSpec = {
  timeSpec: TExplicitTimeRangeSpec;
  label?: string;
};

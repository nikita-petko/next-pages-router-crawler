import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { FormattedText } from '@modules/analytics-translations';
import { TFormattingSpec } from '../numberFormatters';

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
}

export enum ChartUnit {
  Robux = 'robux',
  Percentage = 'percentage', // 2 decimals
  Players = 'players',
  Sessions = 'sessions',
  Days = 'days',
  Hours = 'hours',
  Minutes = 'minutes',
  Seconds = 'seconds',
  Milliseconds = 'milliseconds',
  Impressions = 'impressions',
  Teleports = 'teleports',
  VideoViews = 'videoViews',
  RequestUnits = 'requestunits',
  Requests = 'requests',
  Bytes = 'bytes',
  KiloBytes = 'kilobytes',
  MegaBytes = 'megabytes',
  Gigabytes = 'gigabytes',
  FramesPerSecond = 'framesPerSecond',
  Unknown = 'unknown',
  Results = 'results',
  Score = 'score',
  Sales = 'sales',
  Cancellations = 'cancellations',
  Items = 'items',
  Currency = 'currency',
  Cores = 'cores',
  RoughPercentage = 'roughPercentage', // percentage with 1 decimal
  WholePercentage = 'wholePercentage', // percentage with no decimal
  InExperienceCurrency = 'inExperienceCurrency',
  LegacyPercentage = 'LegacyPercentage',
}

export enum ChartUnitAggregationType {
  Average = 'average',
  Sum = 'sum',
  SummaryTotal = 'total',
  Ratio = 'ratio',
  /**
   * TODO(gperkins@ 20230503): DSA-1035 -- AverageRatio aggregations are always wrong currently,
   *  since they don't independently calculate the numerator and denominator.
   */
  AverageRatio = 'averageRatio',
  Unknown = 'unknown',
  AverageQuotaUsage = 'averageQuotaUsage',
}

export type ChartUnitFormatted = {
  unit?: ChartUnit;
  type?: ChartUnitAggregationType;
  formattingSpec?: TFormattingSpec;
  display: FormattedText;
};
export type GenericChartState = {
  isDataLoading: boolean;
  isResponseFailed: boolean;
  isUserForbidden: boolean;
  /**
   * @deprecated Use `error` instead. To be removed in DSA-4491
   */
  isNoDataAvailable?: boolean;
  error?: Error | null;
};
export type ChartEventLoggers = {
  impressionLogger: () => void;
  hoverImpressionLogger: () => void;
};

export type TExplicitTimeRangeSpec = {
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

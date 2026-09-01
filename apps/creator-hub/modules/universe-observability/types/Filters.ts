import type { LogSeverity } from './LogSeverity';

export enum DateRangePreset {
  All = 'all',
  Last1Hour = 'last1Hour',
  Last1Day = 'last1Day',
  Last7Days = 'last7Days',
  Custom = 'custom',
}

type PresetDateRangeSelection = {
  readonly preset: Exclude<DateRangePreset, DateRangePreset.Custom>;
};

type CustomDateRangeSelection = {
  readonly preset: DateRangePreset.Custom;
  readonly customStart: Date;
  readonly customEnd: Date;
};

export type DateRangeSelection = PresetDateRangeSelection | CustomDateRangeSelection;

export type LogDateRange = {
  readonly min?: Date;
  readonly max?: Date;
};

export type LogFilter = {
  readonly dateRange?: LogDateRange;
  readonly severities?: Array<LogSeverity>;
  readonly logSearchKey?: string;
};

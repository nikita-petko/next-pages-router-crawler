import type {
  RAQIV2DateRangeType,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';

export enum DateRangeSelectionType {
  Preset = 'preset',
  Custom = 'custom',
}

type TDateRangeSelectionBase<TType extends DateRangeSelectionType> = {
  type: TType;
  granularity: RAQIV2MetricGranularity;
};

export type TPresetDateRangeSelection = TDateRangeSelectionBase<DateRangeSelectionType.Preset> & {
  rangeType: Exclude<RAQIV2DateRangeType, typeof RAQIV2DateRangeType.Custom>;
};

export type TCustomDateRangeSelection = TDateRangeSelectionBase<DateRangeSelectionType.Custom> & {
  startTime: Date;
  endTime: Date;
};

type TDateRangeSelection = TPresetDateRangeSelection | TCustomDateRangeSelection;

export default TDateRangeSelection;

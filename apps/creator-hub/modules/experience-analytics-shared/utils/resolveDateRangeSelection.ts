import { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';
import type { TExplicitTimeRangeSpec } from '@modules/charts-generic/charts/types/ChartTypes';
import type TDateRangeSelection from '../types/DateRangeSelection';
import { DateRangeSelectionType } from '../types/DateRangeSelection';
import { calculateDatesFromRangeType } from './dateRangeUtils';
import { snapToLatestEndTime, snapToLatestStartTime } from './snapToLatestTimestep';

const beginningOfTime = new Date(0);

const resolveDateRangeSelection = (selection: TDateRangeSelection): TExplicitTimeRangeSpec => {
  switch (selection.type) {
    case DateRangeSelectionType.Preset: {
      const { startDate, endDate } = calculateDatesFromRangeType({
        rangeType: selection.rangeType,
        maxEndDate: new Date(),
        minStartDate: beginningOfTime,
      });
      return {
        rangeType: selection.rangeType,
        startTime: snapToLatestStartTime(startDate, selection.granularity),
        endTime: snapToLatestEndTime(endDate, selection.granularity),
      };
    }

    case DateRangeSelectionType.Custom:
      return {
        rangeType: RAQIV2DateRangeType.Custom,
        startTime: snapToLatestStartTime(selection.startTime, selection.granularity),
        endTime: snapToLatestEndTime(selection.endTime, selection.granularity),
      };

    default: {
      const exhaustiveCheck: never = selection;
      return exhaustiveCheck;
    }
  }
};

export default resolveDateRangeSelection;

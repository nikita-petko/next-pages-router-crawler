import { createContext, useContext } from 'react';
import { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';
import { getMaxDate, getMinDate } from '../utils/datePickerUtilities';
import emptyFunction from '../utils/emptyFunction';

export type AnalyticsDateRangeBundle = {
  endDate: Date;
  startDate: Date;
  maxEndDate: Date;
  minStartDate: Date;
  rangeType: RAQIV2DateRangeType;
  onChangeRangeType: (type: RAQIV2DateRangeType) => void;
  onChangeDateRangeParams: (
    minDate: Date | null,
    maxDate: Date | null,
    type: RAQIV2DateRangeType,
  ) => void;
  maxRangeDays?: number;
};

export const DefaultAnalyticsQueryDateRangeBundleContext = {
  endDate: getMaxDate(),
  startDate: getMinDate(),
  maxEndDate: new Date(),
  minStartDate: getMinDate(),
  rangeType: RAQIV2DateRangeType.Custom,
  onChangeRangeType: emptyFunction,
  onChangeDateRangeParams: emptyFunction,
  maxRangeDays: undefined,
};

const AnalyticsQueryDateRangeBundleContext = createContext<AnalyticsDateRangeBundle>(
  DefaultAnalyticsQueryDateRangeBundleContext,
);
AnalyticsQueryDateRangeBundleContext.displayName = 'AnalyticsQueryDateRangeBundle';

export const useAnalyticsCurrentDateRangeBundle = () => {
  return useContext(AnalyticsQueryDateRangeBundleContext);
};

export default AnalyticsQueryDateRangeBundleContext;

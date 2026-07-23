import { createContext, useContext } from 'react';
import { getMaxDate, getMinDate } from '../utils/datePickerUtilities';
import DateRangeType from '../enums/DateRangeType';
import emptyFunction from '../utils/emptyFunction';

export type AnalyticsDateRangeBundle = {
  endDate: Date;
  startDate: Date;
  maxEndDate: Date;
  minStartDate: Date;
  rangeType: DateRangeType;
  onChangeRangeType: (type: DateRangeType) => void;
  onChangeDateRangeParams: (
    minDate: Date | null,
    maxDate: Date | null,
    type: DateRangeType,
  ) => void;
  maxRangeDays?: number;
};

export const DefaultAnalyticsQueryDateRangeBundleContext = {
  endDate: getMaxDate(),
  startDate: getMinDate(),
  maxEndDate: new Date(),
  minStartDate: getMinDate(),
  rangeType: DateRangeType.Custom,
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

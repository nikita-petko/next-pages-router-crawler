import { createContext, useContext } from 'react';
import SingleDateType from '../enums/SingleDateType';
import { getMaxDate, getMinDate } from '../utils/datePickerUtilities';

export type AnalyticsSingleDateBundle = {
  date: Date;
  onChangeDate: (date: Date | null) => void;
  maxEndDate: Date;
  minStartDate: Date;
  singleDateType: SingleDateType;
  onChangeDateType: (type: SingleDateType) => void;
  singleDateOptions: SingleDateType[];
};

async function emptyAsyncFunction() {
  // noop
}

export const DefaultAnalyticsQuerySingleDateBundleContext = {
  onChangeDate: emptyAsyncFunction,
  date: getMaxDate(),
  maxEndDate: new Date(),
  minStartDate: getMinDate(),
  singleDateType: SingleDateType.MostRecent,
  onChangeDateType: emptyAsyncFunction,
  singleDateOptions: [SingleDateType.MostRecent, SingleDateType.Custom],
};

const AnalyticsQueryDateRangeBundleContext = createContext<AnalyticsSingleDateBundle>(
  DefaultAnalyticsQuerySingleDateBundleContext,
);
AnalyticsQueryDateRangeBundleContext.displayName = 'AnalyticsQuerySingleBundle';

export const useAnalyticsCurrentSingleDateBundle = () => {
  return useContext(AnalyticsQueryDateRangeBundleContext);
};

export default AnalyticsQueryDateRangeBundleContext;

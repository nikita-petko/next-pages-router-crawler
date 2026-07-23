import { subDays, subMonths } from '@rbx/core';

enum XAxisGranularity {
  Month = 'month',
  Day = 'day',
  Minute = 'minute',
}

export const getXAxisGranularity = (startDate: Date, endDate: Date): XAxisGranularity => {
  if (subDays(endDate, 1) < startDate) {
    return XAxisGranularity.Minute;
  }
  if (subMonths(endDate, 6) < startDate) {
    return XAxisGranularity.Day;
  }
  return XAxisGranularity.Month;
};

export default XAxisGranularity;

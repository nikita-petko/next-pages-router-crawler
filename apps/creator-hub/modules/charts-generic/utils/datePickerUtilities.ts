import { addDays, subDays } from '@rbx/core';

function getMinDate(daysAgoFromToday?: number) {
  const daysAgo = daysAgoFromToday || 40;
  const today = new Date();
  const minDate = subDays(today, daysAgo - 1);
  return minDate;
}

function getMaxDate(minData: Date = getMinDate(), numberOfDay = 40) {
  const maxDate = addDays(minData, numberOfDay - 1);
  const yesterday = subDays(new Date(), 1);
  return maxDate.getTime() > yesterday.getTime() ? yesterday : maxDate;
}

// hard conversion to UTC, because BE endpoint can not aggregate data by hourly,
// so any request it starts UTC 00:00:00 , then the current solution is to force
// client to always show UTC date

const alignToUTCMidnight = (given: Date): Date => {
  return new Date(given.toISOString().slice(0, 10));
};

export { alignToUTCMidnight, getMaxDate, getMinDate };

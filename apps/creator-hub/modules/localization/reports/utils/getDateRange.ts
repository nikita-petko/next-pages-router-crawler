// This function is forked from the web-frontend repo
import type { Locale } from '@rbx/intl';

const daysInMonth = (month: number, year: number) => {
  // Use 1 for January, 2 for February, etc.
  return new Date(year, month, 0).getDate();
};

const getSelectionItem = (locale: Locale, month: number, year: number, isFirstHalf: boolean) => {
  const firstDayOfMonth = 1; // this is universal
  const lastDayOfMonth = daysInMonth(month, year);
  const midDayOfMonth = 15;
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };

  if (isFirstHalf) {
    const startDate = Intl.DateTimeFormat(locale, options).format(
      new Date(year, month - 1, firstDayOfMonth),
    );
    const endDate = Intl.DateTimeFormat(locale, options).format(
      new Date(year, month - 1, midDayOfMonth),
    );
    return {
      id: `${month}-${year}-1`,
      label: `${startDate} - ${endDate}, ${year}`,
      startDate: new Date(Date.UTC(year, month - 1, firstDayOfMonth)),
      endDate: new Date(Date.UTC(year, month - 1, midDayOfMonth + 1)),
    };
  }
  const startDate = Intl.DateTimeFormat(locale, options).format(
    new Date(year, month - 1, midDayOfMonth + 1),
  );
  const endDate = Intl.DateTimeFormat(locale, options).format(
    new Date(year, month - 1, lastDayOfMonth),
  );
  return {
    id: `${month}-${year}-2`,
    label: `${startDate} - ${endDate}, ${year}`,
    startDate: new Date(Date.UTC(year, month - 1, midDayOfMonth + 1)),
    endDate: new Date(Date.UTC(year, month, firstDayOfMonth)),
  };
};

const getMonthsInDateRange = (
  startMonth: number,
  startYear: number,
  endMonth: number,
  endYear: number,
) => {
  const monthsRange = [];
  for (let year = endYear; year >= startYear; year -= 1) {
    for (let month = 11; month >= 0; month -= 1) {
      if (year === endYear && month > endMonth) {
        month = endMonth;
      }

      monthsRange.push({
        month,
        year,
      });

      if (year === startYear && month <= startMonth) {
        month = -1;
      }
    }
  }
  return monthsRange;
};

// returns a list of date range in reverse chronological order from current date to a start date (in past)
const getDateRange = (startDate: Date, endDate: Date, locale: Locale) => {
  const biWeeklyList: { id: string; label: string; startDate: Date; endDate: Date }[] = [];
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  const startMonth = startDate.getMonth();
  const endMonth = endDate.getMonth();

  const monthsRange = getMonthsInDateRange(startMonth, startYear, endMonth, endYear);
  monthsRange.forEach((item) => {
    const { month, year } = item;

    // edge case for current month (first item in series)
    if (month === endMonth && year === endYear) {
      const day = endDate.getDate();
      const lastDay = daysInMonth(month, year);

      /* include both if it matches last day of the month
       * include only first half, if day is greater than 15
       * don't include otherwise
       */
      if (day === lastDay) {
        biWeeklyList.push(getSelectionItem(locale, month + 1, year, false));
        biWeeklyList.push(getSelectionItem(locale, month + 1, year, true));
      } else if (day > 15) {
        biWeeklyList.push(getSelectionItem(locale, month + 1, year, true));
      }
    }

    // edge case for first month (last item in series)
    else if (month === startMonth && year === startYear) {
      const day = startDate.getDate();

      /* include both if it matches first day of the month
       * include only second half, if day is less than 15
       * don't include otherwise
       */
      if (day === 1) {
        biWeeklyList.push(getSelectionItem(locale, month + 1, year, false));
        biWeeklyList.push(getSelectionItem(locale, month + 1, year, true));
      } else if (day < 15) {
        biWeeklyList.push(getSelectionItem(locale, month + 1, year, false));
      }
    } else {
      biWeeklyList.push(getSelectionItem(locale, month + 1, year, false));
      biWeeklyList.push(getSelectionItem(locale, month + 1, year, true));
    }
  });
  return biWeeklyList;
};

export default getDateRange;

import { dateTimeFormatter } from '@rbx/core';
import { Locale } from '@rbx/intl';

export const formatDate = (date: string | Date, locale: Locale): string => {
  const parsedDate: Date = typeof date === 'string' ? new Date(date) : date;
  return dateTimeFormatter(locale).getCustomDateTime(parsedDate, {
    dateStyle: 'medium',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
};

export const getUTCDateString = (given: Date): string => {
  return given.toISOString().slice(0, 10);
};

export const setToUtcMidnight = (given: Date): Date => {
  return new Date(getUTCDateString(given));
};

export type YearMonth = `${number}-${number}` | `${number}-0${number}`; // YYYY-MM

export function isValidYearMonthFormat(monthString: string): monthString is YearMonth {
  const pattern = /^\d{4}-(0?[1-9]|1[0-2])$/;
  return pattern.test(monthString);
}

export function convertToYearMonthFormat(monthDate: Date): YearMonth {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth() + 1;
  if (month < 10) {
    return <`${number}-0${number}`>`${year}-0${month}`;
  }
  return <`${number}-${number}`>`${year}-${month}`;
}

export function handleYearMonthToDate(date: YearMonth): Date {
  return new Date(Number(date.split('-')[0]), Number(date.split('-')[1]) - 1);
}

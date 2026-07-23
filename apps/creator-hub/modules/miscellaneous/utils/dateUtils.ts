import { dateTimeFormatter } from '@rbx/core';
import type { Locale } from '@rbx/intl';

export const formatDate = (date: string | Date, locale: Locale): string => {
  const parsedDate: Date = typeof date === 'string' ? new Date(date) : date;
  return dateTimeFormatter(locale).getCustomDateTime(parsedDate, {
    dateStyle: 'medium',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
};

export const formatTime = (date: string | Date, locale: Locale): string => {
  const parsedDate: Date = typeof date === 'string' ? new Date(date) : date;
  return dateTimeFormatter(locale).getCustomDateTime(parsedDate, {
    timeStyle: 'short',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
};

export const getUTCDateString = (given: Date): string => {
  return given.toISOString().slice(0, 10);
};

// YYYY-MM-DD built from the date's LOCAL calendar fields. Use this (not getUTCDateString)
// when the value represents a day the user picked in their own timezone, so UTC conversion
// doesn't shift it to the previous/next calendar day.
export const getLocalDateString = (given: Date): string => {
  const year = given.getFullYear();
  const month = String(given.getMonth() + 1).padStart(2, '0');
  const day = String(given.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const setToUtcMidnight = (given: Date): Date => {
  return new Date(getUTCDateString(given));
};

export const parseDateOrNull = (value: string | number | Date): Date | null => {
  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
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
    return `${year}-0${month}`;
  }
  return `${year}-${month}`;
}

export function handleYearMonthToDate(date: YearMonth): Date {
  return new Date(Number(date.split('-')[0]), Number(date.split('-')[1]) - 1);
}

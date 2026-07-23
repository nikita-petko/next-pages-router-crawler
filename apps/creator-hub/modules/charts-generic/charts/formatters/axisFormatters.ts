import { useMemo } from 'react';
import { Locale } from '@rbx/intl';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { dateTimeFormatter } from '@rbx/core';
import { ChartStyleMode } from '@rbx/analytics-ui';
import { SeriesIntervalAlignment, SeriesIntervalMeaning } from '../../enums/SeriesIntervalMeaning';
import XAxisGranularity from '../../enums/XAxisGranularity';
import {
  formatHourWithDate,
  shiftLocalizedDateValueFromUserTimezoneToCST,
  shiftLocalizedDateValueFromUserTimezoneToUTC,
} from './timeFormatters';

export const makeCachingXAxisFormatter = (locale: Locale) => {
  const formattedStrings: { [k: string]: string } = {};
  const daysSeen: { [k: string]: boolean } = {};
  return ({ value }: { value: string | number }): string => {
    if (formattedStrings[value]) {
      return formattedStrings[value];
    }
    const date = new Date(value);
    const day = dateTimeFormatter(locale).getCustomDateTime(date, {
      dateStyle: 'short',
    });
    const formatted = daysSeen[day]
      ? dateTimeFormatter(locale).getCustomDateTime(date, {
          timeStyle: 'short',
        })
      : formatHourWithDate(locale, date);
    daysSeen[day] = true;
    formattedStrings[value] = formatted;
    return formatted;
  };
};

export const makeFormatterWithOptions = (locale: Locale, options: Intl.DateTimeFormatOptions) => {
  return new Intl.DateTimeFormat(locale, options);
};

export const makeDailyXAxisFormatterWithOptions = (
  locale: Locale,
  seriesIntervalMeaning: SeriesIntervalMeaning,
  options: Intl.DateTimeFormatOptions,
) => {
  const formatter = makeFormatterWithOptions(locale, options);
  const { alignment } = seriesIntervalMeaning;
  return ({ value }: { value: string | number }): string => {
    switch (alignment) {
      case SeriesIntervalAlignment.UTC_Month_FirstDay:
      case SeriesIntervalAlignment.UTC_Week:
      case SeriesIntervalAlignment.UTC_Day: {
        const utc = shiftLocalizedDateValueFromUserTimezoneToUTC(new Date(value));
        return formatter.format(utc);
      }
      case SeriesIntervalAlignment.CST_Day: {
        const cst = shiftLocalizedDateValueFromUserTimezoneToCST(new Date(value));
        return formatter.format(cst);
      }
      // UTC_Hour and UTC_Minute are likely not possible since x-axis granularity is daily...
      //  but if they do happen, we probably don't want to UTC shift them.
      case SeriesIntervalAlignment.UTC_Hour:
      case SeriesIntervalAlignment.UTC_Minute:
      case SeriesIntervalAlignment.EndTime: {
        const date = new Date(value);
        return formatter.format(date);
      }
      default: {
        const exhaustiveCheck: never = alignment;
        throw new Error(`Unhandled alignment: ${exhaustiveCheck}`);
      }
    }
  };
};

export const useXAxisFormatter = (
  locale: Locale,
  seriesIntervalMeaning: SeriesIntervalMeaning,
  axisGranularity: XAxisGranularity,
  chartStyleMode: ChartStyleMode,
) => {
  return useMemo(() => {
    const { length } = seriesIntervalMeaning;
    switch (length) {
      case RAQIV2MetricGranularity.OneHour:
      case RAQIV2MetricGranularity.HalfHour:
      case RAQIV2MetricGranularity.OneMinute:
        // For a mini chart, when granularity is less then an hour, we only
        // want to show the date not the time.
        return chartStyleMode === ChartStyleMode.Minimal
          ? makeDailyXAxisFormatterWithOptions(locale, seriesIntervalMeaning, {
              month: 'short',
              day: 'numeric',
            })
          : makeCachingXAxisFormatter(locale);
      case RAQIV2MetricGranularity.OneMonth:
      case RAQIV2MetricGranularity.None:
      case RAQIV2MetricGranularity.OneWeek:
      case RAQIV2MetricGranularity.OneDay: {
        switch (axisGranularity) {
          case XAxisGranularity.Minute:
          case XAxisGranularity.Month:
            return makeDailyXAxisFormatterWithOptions(locale, seriesIntervalMeaning, {
              month: 'short',
              year: 'numeric',
            });
          case XAxisGranularity.Day:
            return makeDailyXAxisFormatterWithOptions(locale, seriesIntervalMeaning, {
              month: 'short',
              day: 'numeric',
            });
          default: {
            const exhaustiveCheck: never = axisGranularity;
            throw new Error(`Unhandled x-axis granularity: ${exhaustiveCheck}`);
          }
        }
      }
      default: {
        const exhaustiveCheck: never = length;
        throw new Error(`Unhandled series granularity: ${exhaustiveCheck}`);
      }
    }
  }, [seriesIntervalMeaning, chartStyleMode, locale, axisGranularity]);
};

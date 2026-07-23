import { useMemo } from 'react';
import { ChartStyleMode } from '@rbx/analytics-ui';
import { dateTimeFormatter } from '@rbx/core';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { Locale } from '@rbx/intl';
import XAxisGranularity from '../../enums/XAxisGranularity';
import { formatHourWithDate, shiftLocalizedDateValueFromUserTimezoneToUTC } from './timeFormatters';

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
  granularity: RAQIV2MetricGranularity,
  options: Intl.DateTimeFormatOptions,
) => {
  const formatter = makeFormatterWithOptions(locale, options);
  return ({ value }: { value: string | number }): string => {
    switch (granularity) {
      case RAQIV2MetricGranularity.OneMonth:
      case RAQIV2MetricGranularity.OneWeek:
      case RAQIV2MetricGranularity.OneDay: {
        const utc = shiftLocalizedDateValueFromUserTimezoneToUTC(new Date(value));
        return formatter.format(utc);
      }
      // Sub-day granularities are aligned to UTC hour/minute boundaries; we don't UTC-shift them.
      // None has no fixed alignment.
      case RAQIV2MetricGranularity.OneHour:
      case RAQIV2MetricGranularity.HalfHour:
      case RAQIV2MetricGranularity.OneMinute:
      case RAQIV2MetricGranularity.None: {
        const date = new Date(value);
        return formatter.format(date);
      }
      default: {
        const exhaustiveCheck: never = granularity;
        throw new Error(`Unhandled metric granularity: ${String(exhaustiveCheck)}`);
      }
    }
  };
};

export const useXAxisFormatter = (
  locale: Locale,
  granularity: RAQIV2MetricGranularity,
  axisGranularity: XAxisGranularity,
  chartStyleMode: ChartStyleMode,
) => {
  return useMemo(() => {
    switch (granularity) {
      case RAQIV2MetricGranularity.OneHour:
      case RAQIV2MetricGranularity.HalfHour:
      case RAQIV2MetricGranularity.OneMinute:
        // For a mini chart, when granularity is less then an hour, we only
        // want to show the date not the time.
        return chartStyleMode === ChartStyleMode.Minimal
          ? makeDailyXAxisFormatterWithOptions(locale, granularity, {
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
            return makeDailyXAxisFormatterWithOptions(locale, granularity, {
              month: 'short',
              year: 'numeric',
            });
          case XAxisGranularity.Day:
            return makeDailyXAxisFormatterWithOptions(locale, granularity, {
              month: 'short',
              day: 'numeric',
            });
          default: {
            const exhaustiveCheck: never = axisGranularity;
            throw new Error(`Unhandled x-axis granularity: ${String(exhaustiveCheck)}`);
          }
        }
      }
      default: {
        const exhaustiveCheck: never = granularity;
        throw new Error(`Unhandled series granularity: ${String(exhaustiveCheck)}`);
      }
    }
  }, [granularity, chartStyleMode, locale, axisGranularity]);
};

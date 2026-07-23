import { Locale } from '@rbx/intl';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { dateTimeFormatter } from '@rbx/core';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ChartStyleMode } from '@rbx/analytics-ui';
import {
  FormattedText,
  translationKey,
  TranslationKeyToFormattedText,
} from '@modules/analytics-translations';
import { RAQIV2TranslationDependencies } from '@modules/experience-analytics-shared';
import dateUtils from '../../utils/dateUtils';
import logAnalyticsError from '../../utils/logAnalyticsError';
import { SeriesIntervalAlignment, SeriesIntervalMeaning } from '../../enums/SeriesIntervalMeaning';
import { DurationBucketType } from '../types/DurationSplineChartTypes';

export const formatDateWithoutYear = (
  locale: Locale,
  timestamp: Date,
  useNumericDay = false,
): FormattedText => {
  return dateTimeFormatter(locale).getCustomDateTime(timestamp, {
    month: 'short',
    day: useNumericDay ? 'numeric' : '2-digit',
  }) as FormattedText;
};

export const formatDateUsingDefaultFormat = (locale: Locale, timestamp: Date): FormattedText => {
  return dateTimeFormatter(locale).getCustomDateTime(timestamp, {
    timeStyle: undefined,
  }) as FormattedText;
};

export const formatShortDateTime = (timestamp: Date, locale: Locale): FormattedText => {
  return dateTimeFormatter(locale).getCustomDateTime(timestamp, {
    dateStyle: 'short',
    timeStyle: 'short',
  }) as FormattedText;
};

export const formatShortDateTimeWithoutYear = (timestamp: Date, locale: Locale): FormattedText => {
  return dateTimeFormatter(locale).getCustomDateTime(timestamp, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) as FormattedText;
};

export const formatMediumDate = (timestamp: Date, locale: Locale): FormattedText => {
  return dateTimeFormatter(locale).getCustomDateTime(timestamp, {
    dateStyle: 'medium',
  }) as FormattedText;
};

export const formatMediumDateTime = (timestamp: Date, locale: Locale): FormattedText => {
  return dateTimeFormatter(locale).getCustomDateTime(timestamp, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }) as FormattedText;
};

const shiftLocalizedDateValueFromUserTimezoneToGivenOffset = (
  valueGiven: Date,
  targetOffsetMinutes: number,
): Date => {
  const offsetMinutes = valueGiven.getTimezoneOffset();
  const newValue = new Date(valueGiven);
  newValue.setMinutes(valueGiven.getMinutes() + offsetMinutes - targetOffsetMinutes);
  return newValue;
};

const cstOffsetMinutes = 360;
export const shiftLocalizedDateValueFromUserTimezoneToCST = (valueGiven: Date): Date => {
  return shiftLocalizedDateValueFromUserTimezoneToGivenOffset(valueGiven, cstOffsetMinutes);
};

export const shiftLocalizedDateValueFromUserTimezoneToUTC = (valueGiven: Date): Date => {
  return shiftLocalizedDateValueFromUserTimezoneToGivenOffset(valueGiven, 0);
};

export const formatShortDateInUTC = (
  timestamp: Date,
  locale: Locale,
  translate: TranslationKeyToFormattedText,
): FormattedText => {
  const utc = shiftLocalizedDateValueFromUserTimezoneToUTC(timestamp);
  const date = dateTimeFormatter(locale).getCustomDateTime(utc, {
    dateStyle: 'short',
  });
  return translate(translationKey('Timestamp.ShortDateInUTC', TranslationNamespace.Analytics), {
    date,
  });
};

export const formatMediumDateInUTC = (timestamp: Date, locale: Locale): FormattedText => {
  const utc = shiftLocalizedDateValueFromUserTimezoneToUTC(timestamp);
  return dateTimeFormatter(locale).getCustomDateTime(utc, {
    dateStyle: 'medium',
  }) as FormattedText;
};

export const formatDateInUTCWithCurrentYearHidden = ({
  timestamp,
  locale,
  options,
}: {
  timestamp: Date;
  locale: Locale;
  options?: {
    day?: Intl.DateTimeFormatOptions['day'];
    month?: Intl.DateTimeFormatOptions['month'];
    year?: Intl.DateTimeFormatOptions['year'];
  };
}) => {
  const utc = shiftLocalizedDateValueFromUserTimezoneToUTC(timestamp);

  const today = dateUtils.getCurrentDate();

  // If timestamp has is within current year, we choose to hide it regardless
  // of the options provided.
  const hideYear = timestamp.getUTCFullYear() === today.getUTCFullYear();

  return dateTimeFormatter(locale).getCustomDateTime(utc, {
    ...options,
    year: hideYear ? undefined : options?.year,
  }) as FormattedText;
};

export const formatDateWithoutYearInUTC = (timestamp: Date, locale: Locale): FormattedText => {
  const utc = shiftLocalizedDateValueFromUserTimezoneToUTC(timestamp);
  return dateTimeFormatter(locale).getCustomDateTime(utc, {
    month: 'numeric',
    day: '2-digit',
  }) as FormattedText;
};

export const formatShortDateInCST = (
  timestamp: Date,
  locale: Locale,
  translate: TranslationKeyToFormattedText,
): FormattedText => {
  const utc = shiftLocalizedDateValueFromUserTimezoneToCST(timestamp);
  const date = dateTimeFormatter(locale).getCustomDateTime(utc, {
    dateStyle: 'short',
  });
  return translate(translationKey('Timestamp.ShortDateInCST', TranslationNamespace.Analytics), {
    date,
  });
};

// NOTE: (lucaswang 2023-02-10) Only being exported for tests
export const formatTimestamp = (
  seriesIntervalMeaning: SeriesIntervalMeaning,
  locale: Locale,
  timestamp: Date,
): FormattedText => {
  const { length } = seriesIntervalMeaning;
  switch (length) {
    case RAQIV2MetricGranularity.OneHour:
    case RAQIV2MetricGranularity.HalfHour:
    case RAQIV2MetricGranularity.OneMinute:
      return formatShortDateTime(timestamp, locale);
    case RAQIV2MetricGranularity.OneMonth:
    case RAQIV2MetricGranularity.OneDay:
    case RAQIV2MetricGranularity.OneWeek:
    case RAQIV2MetricGranularity.None:
      return formatDateUsingDefaultFormat(locale, timestamp);

    default: {
      const exhaustiveCheck: never = length;
      throw new Error(`Unhandled chart granularity: ${exhaustiveCheck}`);
    }
  }
};

export const formatHourWithDate = (locale: Locale, date: Date) => {
  const time = dateTimeFormatter(locale).getCustomDateTime(date, {
    timeStyle: 'short',
  });
  const day = dateTimeFormatter(locale).getCustomDateTime(date, {
    month: 'numeric',
    day: 'numeric',
  });
  return `${time}<br/>${day}`;
};

const padTwoDigits = (n: number) => n.toString().padStart(2, '0');

// Formats seconds into duration (MM:SS or HH:MM:SS when >= 1 hour).
// NOTE: this is not localized, since it's a little bit complex for the native Javascript library to handle
// TODO(gperkins 20240222): use luxon to localize durations?
export const formatDurationInSecond = (secondValue: number | string) => {
  if (typeof secondValue === 'string') {
    return secondValue;
  }

  const totalSeconds = Math.floor(secondValue);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${padTwoDigits(hours)}:${padTwoDigits(minutes)}:${padTwoDigits(seconds)}`;
  }
  return `${padTwoDigits(minutes)}:${padTwoDigits(seconds)}`;
};

export const formatDurationInMinute = (minuteValue: number | string) => {
  if (typeof minuteValue === 'string') {
    return minuteValue;
  }

  const hour = Math.floor(minuteValue / 60);
  if (hour > 60) {
    logAnalyticsError(`formatDuration should not be greater than 60 hours: ${minuteValue}`);
  }
  const minutes = Math.floor(minuteValue % 60);
  const seconds = Math.floor((minuteValue * 60) % 60);

  return `${padTwoDigits(hour)}:${padTwoDigits(minutes)}:${padTwoDigits(seconds)}`;
};

export const formatDurationInDay = (
  dayValue: number | string,
  translationDependencies: RAQIV2TranslationDependencies,
): FormattedText => {
  return translationDependencies.translate(
    translationKey('Description.DayNumber', TranslationNamespace.Analytics),
    {
      number: dayValue.toString(),
    },
  );
};

/**
 *
 * TODO(gperkins@ 20240229): This is nonsensical and terrifying, but it is what works. :(
 *  (possibly our dateGivenTimezones are all inverted...?)
 * It functions the same as shiftLocalizedDateValueFromUserTimezoneToUTC() but is misnamed.
 * See DSA-2088: Replace all our timezone shifting logic with e.g. Luxon or dayjs...
 *
 * This function claims to be going from UTC to local time, but it's actually going from local time to UTC time.
 *  getTimezoneOffset() = UTC time - local time
 *  so UTC time = local time + getTimezoneOffset()
 *  so this function is actually going from local time to UTC time.
 */
export const badlyMisnamedFormatLocalizedDateValueFromUTCToUserTimezone = (
  valueGiven: Date,
): Date => {
  const offsetMinutes = valueGiven.getTimezoneOffset();
  const newValue = new Date(valueGiven);
  newValue.setMinutes(valueGiven.getMinutes() + offsetMinutes);
  return newValue;
};

export const formatSingleDate = (
  locale: Locale,
  dateGiven: Date,
  dateGivenTimezone: 'UTC' | 'Local' = 'UTC',
  withoutYear = false,
  omitLeadingZero = false,
): FormattedText => {
  const date =
    dateGivenTimezone === 'Local'
      ? dateGiven
      : badlyMisnamedFormatLocalizedDateValueFromUTCToUserTimezone(dateGiven);

  return withoutYear
    ? formatDateWithoutYear(locale, date, omitLeadingZero)
    : formatDateUsingDefaultFormat(locale, date);
};

export const formatDateRange = (
  locale: Locale,
  startDate: Date,
  endDate: Date,
  dateGivenTimezone: 'UTC' | 'Local' = 'UTC',
  withoutYear = false,
  omitLeadingZero = false,
) => {
  const startString = formatSingleDate(
    locale,
    startDate,
    dateGivenTimezone,
    withoutYear,
    omitLeadingZero,
  );
  const endString = formatSingleDate(
    locale,
    endDate,
    dateGivenTimezone,
    withoutYear,
    omitLeadingZero,
  );
  return `${startString} - ${endString}` as FormattedText;
};

export const formatTimestampForChartTooltip = (
  seriesIntervalMeaning: SeriesIntervalMeaning,
  locale: Locale,
  timestamp: Date,
  translate: TranslationKeyToFormattedText,
  timeAxisSpec?: { startDate: Date; endDate: Date },
  chartStyleMode: ChartStyleMode = ChartStyleMode.Normal,
): FormattedText => {
  const { length, alignment } = seriesIntervalMeaning;
  switch (length) {
    case RAQIV2MetricGranularity.OneHour:
    case RAQIV2MetricGranularity.OneMinute:
    case RAQIV2MetricGranularity.HalfHour:
      if (chartStyleMode === ChartStyleMode.Minimal) {
        return formatShortDateTimeWithoutYear(timestamp, locale);
      }
      return formatShortDateTime(timestamp, locale);
    case RAQIV2MetricGranularity.OneMonth:
    case RAQIV2MetricGranularity.OneDay:
    case RAQIV2MetricGranularity.OneWeek: {
      switch (alignment) {
        case SeriesIntervalAlignment.CST_Day:
          return formatShortDateInCST(timestamp, locale, translate);
        case SeriesIntervalAlignment.UTC_Day:
        case SeriesIntervalAlignment.UTC_Week:
        case SeriesIntervalAlignment.UTC_Month_FirstDay: {
          return formatShortDateInUTC(timestamp, locale, translate);
        }
        // Only CST_Day and EndTime make any sense, but handle the others too
        case SeriesIntervalAlignment.UTC_Hour:
        case SeriesIntervalAlignment.UTC_Minute:
        case SeriesIntervalAlignment.EndTime:
          return formatDateUsingDefaultFormat(locale, timestamp);
        default: {
          const exhaustiveCheck: never = alignment;
          throw new Error(`Unhandled alignment: ${exhaustiveCheck}`);
        }
      }
    }
    case RAQIV2MetricGranularity.None:
      if (timeAxisSpec) {
        return formatDateRange(locale, timeAxisSpec.startDate, timeAxisSpec.endDate);
      }
      return formatDateUsingDefaultFormat(locale, timestamp);
    default: {
      const exhaustiveCheck: never = length;
      throw new Error(`Unhandled chart granularity: ${exhaustiveCheck}`);
    }
  }
};

export const makeDurationFormatter = (
  bucketType: DurationBucketType,
  translationDependencies: RAQIV2TranslationDependencies,
) => {
  switch (bucketType) {
    case DurationBucketType.ServerMemoryAge: {
      return ({ value }: { value: number | string }) => formatDurationInMinute(value);
    }
    case DurationBucketType.SecondsSinceStart: {
      return ({ value }: { value: number | string }) => formatDurationInSecond(value);
    }
    case DurationBucketType.CohortDay: {
      return ({ value }: { value: number | string }) =>
        formatDurationInDay(value, translationDependencies);
    }
    default: {
      const exhaustiveCheck: never = bucketType;
      throw new Error(`Exhaustive check for bucketType: ${exhaustiveCheck}`);
    }
  }
};

import { LicenseDurationResponse, LicenseDurationType } from '@rbx/clients/contentLicensingApi/v1';
import { dateTimeFormatter } from '@rbx/core';
import { Locale } from '@rbx/intl';

import { mockIntlTranslateForTests } from '../../test-utils/mockIntlTranslate';
import { MS_PER_DAY } from '../constants';

export type TimelimitedDateRange = {
  startDate: Date;
  endDate: Date;
};

// TODO - TIME-112 - aquach - consume this enum from the backend when ready
export enum LicenseDurationBucket {
  ThreeDays = 3,
  SevenDays = 7,
  FourteenDays = 14,
  OneMonth = 30, // Rough approx as placeholder
  ThreeMonths = 90, // Rough approx as placeholder
}

const allDurationBucketsSorted = (Object.values(LicenseDurationBucket) as (string | number)[])
  .filter((v): v is LicenseDurationBucket => typeof v === 'number')
  .sort((a, b) => a - b);

// All LicenseDurationBucket enums except the largest bucket
export const minimumDurationBuckets: LicenseDurationBucket[] = allDurationBucketsSorted.slice(
  0,
  -1,
);

// All LicenseDurationBucket enums except the smallest bucket
export const maximumDurationBuckets: LicenseDurationBucket[] = allDurationBucketsSorted.slice(1);

/**
 * Helper to fetch the appropriate translation key for the duration bucket.
 */
export const getLabelForDurationBucket = (
  bucket: LicenseDurationBucket,
  translate: (
    key: string,
    args?: {
      [key: string]: string;
    },
  ) => string,
) => {
  switch (bucket) {
    case LicenseDurationBucket.ThreeDays:
    case LicenseDurationBucket.SevenDays:
    case LicenseDurationBucket.FourteenDays:
      return translate('Label.LicenseDateRangeNumDaysOther', { count: String(bucket) });
    case LicenseDurationBucket.OneMonth:
      return translate('Label.LicenseDateRangeNumMonthsOne');
    case LicenseDurationBucket.ThreeMonths:
      // Bucket value is 90, not 3 but we want the label to resolve to '3 months'
      return translate('Label.LicenseDateRangeNumMonthsOther', { count: '3' });
    default:
      return 'Unknown';
  }
};

/**
 * Matcher for Testing Library `getByRole('option', { name })` on duration bucket menu items.
 * Normalizes whitespace because MUI accessible names can differ from pretty-printed
 * `JSON.stringify(args, null, 2)` from the intl Jest mock.
 *
 * When `translate` is omitted, uses {@link mockIntlTranslateForTests} (same shape as the Jest
 * `@rbx/intl` mock). Pass an explicit `translate` when matching a different implementation.
 */
export function matchDurationBucketSelectOption(
  bucket: LicenseDurationBucket,
  translate: (key: string, args?: { [key: string]: string }) => string = mockIntlTranslateForTests,
) {
  const expected = getLabelForDurationBucket(bucket, translate).replace(/\s+/g, ' ').trim();

  return (accessibleName: string) => accessibleName.replace(/\s+/g, ' ').trim() === expected;
}

/**
 * Normalizes duration table cell text for RTL assertions. The Jest intl mock nests
 * `JSON.stringify` output inside another `translate` call; the DOM can differ in
 * whitespace and in how `\"` / `\n` appear vs real quotes and newlines.
 */
export function normalizeDurationRangeCellText(s: string): string {
  return s.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\s+/g, ' ').trim();
}

/** i18n keys returned by {@link validateDurationBuckets} when validation fails */
export type DurationBucketValidationErrorKey =
  | 'Error.SameMinMaxDurationRange'
  | 'Error.MinLargerThanMaxDurationRange';

/**
 * Validates minimum vs maximum duration bucket selections.
 * Returns `true` when valid, or a translation key to pass to `translate` at the call site.
 */
export const validateDurationBuckets =
  (isMinBucket: boolean, otherBucket?: LicenseDurationBucket) =>
  (currentBucket?: LicenseDurationBucket): true | DurationBucketValidationErrorKey => {
    if (currentBucket && otherBucket) {
      if (currentBucket === otherBucket) {
        return 'Error.SameMinMaxDurationRange';
      }
      if (isMinBucket && currentBucket > otherBucket) {
        return 'Error.MinLargerThanMaxDurationRange';
      }
      if (!isMinBucket && currentBucket < otherBucket) {
        return 'Error.SameMinMaxDurationRange';
      }
    }

    return true;
  };

/**
 * Helper to check if numDays exists as a key in the reverse-mapped enum, otherwise return undefined.
 */
export const convertNumDaysToDurationBucket = (
  numDays?: number,
): LicenseDurationBucket | undefined => {
  if (!numDays) {
    return undefined;
  }
  return numDays in LicenseDurationBucket ? (numDays as LicenseDurationBucket) : undefined;
};

/**
 * Helper to fetch what label to show based on the license's duration.
 * Used in license table.
 */
export const getDurationRangeLabel = (
  translate: (
    key: string,
    args?: {
      [key: string]: string;
    },
  ) => string,
  licenseDuration?: LicenseDurationResponse | null,
) => {
  if (!licenseDuration || !licenseDuration.durationType) {
    return translate('Label.Unknown');
  }

  const { durationType, timeBounds } = licenseDuration;
  if (durationType === LicenseDurationType.Perpetual) {
    return translate('Label.Perpetual');
  }

  if (durationType === LicenseDurationType.TimeLimited && timeBounds && timeBounds.minMax) {
    const { minDays, maxDays } = timeBounds.minMax;
    const minBucket = convertNumDaysToDurationBucket(minDays);
    const maxBucket = convertNumDaysToDurationBucket(maxDays);
    const minLabel =
      minBucket !== undefined ? getLabelForDurationBucket(minBucket, translate) : 'Label.Unknown';
    const maxLabel =
      maxBucket !== undefined ? getLabelForDurationBucket(maxBucket, translate) : 'Label.Unknown';
    return translate('Label.DurationRangeWithValues', {
      minValue: minLabel,
      maxValue: maxLabel,
    });
  }

  return translate('Label.Unknown');
};

/**
 * Builds `licenseDuration` for create/update license API requests.
 * The backend rejects `timeBounds` unless `durationType` is TimeLimited.
 */
export const buildLicenseDurationForRequest = (
  durationType: LicenseDurationType,
  minMax?: { minDays?: number; maxDays?: number },
) => {
  if (durationType === LicenseDurationType.TimeLimited) {
    return {
      durationType,
      timeBounds: {
        minMax: {
          minDays: minMax?.minDays,
          maxDays: minMax?.maxDays,
        },
      },
    };
  }
  return { durationType };
};

/**
 * Returns the given date at UTC midnight (00:00:00.000).
 * Used for calendar-day comparisons in UTC.
 */
export const getUtcMidnight = (date: Date | string | null | undefined): Date | null => {
  if (date == null) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
};

/**
 * True when the current date is within 72 hours of the given date's UTC calendar day.
 */
export const isWithinThreeDaysOfDate = (date: Date | string | null | undefined): boolean => {
  const normalizedDate = getUtcMidnight(date);
  if (!normalizedDate) return false;
  const MS_PER_72_HOURS = 3 * MS_PER_DAY;
  return Math.abs(Date.now() - normalizedDate.getTime()) <= MS_PER_72_HOURS;
};

/**
 * Formats a date range for display based on the user's locale (e.g. "Jan 7 - Jan 16, 2026").
 */
export const getDateRangeLabel = (
  startDate: Date | null | undefined,
  endDate: Date | null | undefined,
  locale: Locale = Locale.English,
): string => {
  if (!startDate || !endDate) return '';
  const formatter = dateTimeFormatter(locale);
  const format = (d: Date) => formatter.getCustomDateTime(d, { month: 'short', day: 'numeric' });
  const year = startDate.getFullYear();
  return `${format(startDate)} - ${format(endDate)}, ${year}`;
};

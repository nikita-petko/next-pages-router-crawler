import type { Locale } from '@rbx/intl';
import type { TranslationKeyToFormattedText } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export const getCurrentDate = () => {
  return new Date();
};

export const getCurrentHourDate = () => {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  return now;
};

export const subHours = (curr: Date, diff: number): Date => {
  const newDay = new Date(curr);
  newDay.setHours(curr.getHours() - diff);
  return newDay;
};

export const subMinutes = (curr: Date, diff: number): Date => {
  const newDate = new Date(curr);
  newDate.setMinutes(curr.getMinutes() - diff);
  return newDate;
};

const timeRangeStartDateDisplayOptions: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
};

const timeRangeEndDateDisplayOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};

export const hourInMilliseconds = 60 * 60 * 1000;

export default { getCurrentDate, subHours, getCurrentHourDate, hourInMilliseconds };

export const earlierDate = (a: Date, b: Date): Date => {
  return a < b ? a : b;
};
export const laterDate = (a: Date, b: Date): Date => {
  return a < b ? b : a;
};

export const formatDateFromNow = (date: Date, translate: TranslationKeyToFormattedText): string => {
  const parsedDate: Date = typeof date === 'string' ? new Date(date) : date;
  const secondsElapsed = (Date.now() - new Date(parsedDate).getTime()) / 1000;

  if (secondsElapsed < 0) {
    return translate(translationKey('Label.UpdatedNow', TranslationNamespace.Home));
  }

  if (secondsElapsed < 60) {
    return translate(translationKey('Label.UpdatedFromNow', TranslationNamespace.Home), {
      fromNow: `${Math.floor(secondsElapsed)}${translate(
        translationKey('Label.SecondsSymbol', TranslationNamespace.Home),
      )}`,
    });
  }

  const minutesElapsed = secondsElapsed / 60;
  if (minutesElapsed < 60) {
    return translate(translationKey('Label.UpdatedFromNow', TranslationNamespace.Home), {
      fromNow: `${Math.floor(minutesElapsed)}${translate(
        translationKey('Label.MinutesSymbol', TranslationNamespace.Home),
      )}`,
    });
  }

  const hoursElapsed = minutesElapsed / 60;
  if (hoursElapsed < 24) {
    return translate(translationKey('Label.UpdatedFromNow', TranslationNamespace.Home), {
      fromNow: `${Math.floor(hoursElapsed)}${translate(
        translationKey('Label.HoursSymbol', TranslationNamespace.Home),
      )}`,
    });
  }

  const daysElapsed = hoursElapsed / 24;
  if (daysElapsed < 30) {
    return translate(translationKey('Label.UpdatedFromNow', TranslationNamespace.Home), {
      fromNow: `${Math.floor(daysElapsed)}${translate(
        translationKey('Label.DaysSymbol', TranslationNamespace.Home),
      )}`,
    });
  }

  const monthsElapsed = daysElapsed / 30;
  if (monthsElapsed < 12) {
    return translate(translationKey('Label.UpdatedFromNow', TranslationNamespace.Home), {
      fromNow: `${Math.floor(monthsElapsed)}${translate(
        translationKey('Label.MonthsSymbol', TranslationNamespace.Home),
      )}`,
    });
  }

  const yearsElapsed = monthsElapsed / 12;
  return translate(translationKey('Label.UpdatedFromNow', TranslationNamespace.Home), {
    fromNow: `${Math.floor(yearsElapsed)}${translate(
      translationKey('Label.YearsSymbol', TranslationNamespace.Home),
    )}`,
  });
};

export const formatDateRangeForKey = (locale: Locale, startTime: Date, endTime: Date) => {
  const startDateLocaleString = startTime.toLocaleDateString(
    locale,
    timeRangeStartDateDisplayOptions,
  );
  const endDateLocaleString = endTime.toLocaleDateString(locale, timeRangeEndDateDisplayOptions);
  return `${startDateLocaleString} - ${endDateLocaleString}`;
};

/**
 * Compact "time ago" label (e.g. "1m ago", "5m ago", "10d ago") without the
 * surrounding "Updated ..." copy that {@link formatDateFromNow} adds. Used by
 * overview cards where horizontal space is tight.
 *
 * Each tier maps to a single ExperienceAlerts key whose copy embeds the count
 * (e.g. "{count}s ago"). This lets translators reorder the number and the
 * "ago" suffix in locales where that matters, instead of concatenating a bare
 * unit symbol after the number.
 */
export const formatTimeAgoCompact = (
  date: Date,
  translate: TranslationKeyToFormattedText,
): string => {
  const parsedDate: Date = typeof date === 'string' ? new Date(date) : date;
  const secondsElapsed = (Date.now() - new Date(parsedDate).getTime()) / 1000;

  if (secondsElapsed < 60) {
    const seconds = Math.max(0, Math.floor(secondsElapsed));
    return translate(
      translationKey('Label.TimeAgoSeconds', TranslationNamespace.ExperienceAlerts),
      {
        count: String(seconds),
      },
    );
  }

  const minutesElapsed = secondsElapsed / 60;
  if (minutesElapsed < 60) {
    return translate(
      translationKey('Label.TimeAgoMinutes', TranslationNamespace.ExperienceAlerts),
      {
        count: String(Math.floor(minutesElapsed)),
      },
    );
  }

  const hoursElapsed = minutesElapsed / 60;
  if (hoursElapsed < 24) {
    return translate(translationKey('Label.TimeAgoHours', TranslationNamespace.ExperienceAlerts), {
      count: String(Math.floor(hoursElapsed)),
    });
  }

  const daysElapsed = hoursElapsed / 24;
  if (daysElapsed < 30) {
    return translate(translationKey('Label.TimeAgoDays', TranslationNamespace.ExperienceAlerts), {
      count: String(Math.floor(daysElapsed)),
    });
  }

  const monthsElapsed = daysElapsed / 30;
  if (monthsElapsed < 12) {
    return translate(translationKey('Label.TimeAgoMonths', TranslationNamespace.ExperienceAlerts), {
      count: String(Math.floor(monthsElapsed)),
    });
  }

  const yearsElapsed = monthsElapsed / 12;
  return translate(translationKey('Label.TimeAgoYears', TranslationNamespace.ExperienceAlerts), {
    count: String(Math.floor(yearsElapsed)),
  });
};

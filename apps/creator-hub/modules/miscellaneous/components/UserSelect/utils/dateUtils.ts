import type { UseTranslationResult } from '@rbx/intl';

type TTranslate = UseTranslationResult['translate'];

/**
 * Formats a date to a relative time string (e.g. "2 days ago", "1 hour ago")
 * Supports "just now" (for future or 0 seconds), seconds, minutes, hours, days, months, years
 */
export const formatDateFromNow = (date: Date, translate: TTranslate): string => {
  const getTimeAgoString = (
    timeElapsed: number,
    unitTranslationLabelSingular: string,
    unitTranslationLabelPlural: string,
  ): string => {
    const unitTranslationLabel =
      timeElapsed === 1 ? unitTranslationLabelSingular : unitTranslationLabelPlural;
    return `${timeElapsed} ${translate(unitTranslationLabel)} ${translate('Label.Ago')}`;
  };

  const parsedDate: Date = typeof date === 'string' ? new Date(date) : date;
  const secondsElapsed = (Date.now() - new Date(parsedDate).getTime()) / 1000;

  if (secondsElapsed <= 0) {
    return translate('Label.JustNow');
  }

  if (secondsElapsed < 60) {
    return getTimeAgoString(Math.floor(secondsElapsed), 'Label.Second', 'Label.SecondPlural');
  }

  const minutesElapsed = secondsElapsed / 60;
  if (minutesElapsed < 60) {
    return getTimeAgoString(Math.floor(minutesElapsed), 'Label.Minute', 'Label.MinutePlural');
  }

  const hoursElapsed = minutesElapsed / 60;
  if (hoursElapsed < 24) {
    return getTimeAgoString(Math.floor(hoursElapsed), 'Label.Hour', 'Label.HourPlural');
  }

  const daysElapsed = hoursElapsed / 24;
  if (daysElapsed < 30) {
    return getTimeAgoString(Math.floor(daysElapsed), 'Label.Day', 'Label.DayPlural');
  }

  const monthsElapsed = daysElapsed / 30;
  if (monthsElapsed < 12) {
    return getTimeAgoString(Math.floor(monthsElapsed), 'Label.Month', 'Label.MonthPlural');
  }

  const yearsElapsed = monthsElapsed / 12;
  return getTimeAgoString(Math.floor(yearsElapsed), 'Label.Year', 'Label.YearPlural');
};

export default formatDateFromNow;

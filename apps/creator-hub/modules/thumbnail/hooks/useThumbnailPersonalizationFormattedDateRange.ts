import {
  badlyMisnamedFormatLocalizedDateValueFromUTCToUserTimezone,
  useLocale,
} from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { useMemo } from 'react';
import { dateTimeFormatter } from '@rbx/core';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export const ThumbnailPersonalizationTableTitleKey = translationKey(
  'Title.Table.ThumbnailsPersonalization',
  TranslationNamespace.Analytics,
);

export const useThumbnailPersonalizationFormattedDateRange = (
  startTimeUTC: Date,
  endTimeUTC: Date,
) => {
  const locale = useLocale();
  return useMemo(() => {
    const formattedStartTime = dateTimeFormatter(locale).getCustomDateTime(
      badlyMisnamedFormatLocalizedDateValueFromUTCToUserTimezone(startTimeUTC),
      {
        month: 'short',
        day: 'numeric',
      },
    );
    const formattedEndTime = dateTimeFormatter(locale).getCustomDateTime(
      badlyMisnamedFormatLocalizedDateValueFromUTCToUserTimezone(endTimeUTC),
      {
        month: 'short',
        day: 'numeric',
      },
    );
    return `${formattedStartTime} - ${formattedEndTime}`;
  }, [endTimeUTC, locale, startTimeUTC]);
};

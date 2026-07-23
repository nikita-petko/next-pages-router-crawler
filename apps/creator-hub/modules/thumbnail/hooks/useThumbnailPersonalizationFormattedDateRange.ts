import { useMemo } from 'react';
import { dateTimeFormatter } from '@rbx/core';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { badlyMisnamedFormatLocalizedDateValueFromUTCToUserTimezone } from '@modules/charts-generic/charts/formatters/timeFormatters';
import useLocale from '@modules/charts-generic/context/useLocale';
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

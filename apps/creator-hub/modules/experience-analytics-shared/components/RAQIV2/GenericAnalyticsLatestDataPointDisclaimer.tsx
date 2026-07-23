import type { FC } from 'react';
import { dateTimeFormatter } from '@rbx/core';
import type { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import { Typography } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useLocale from '@modules/charts-generic/context/useLocale';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useMetricLatestAvailableTime from '../../hooks/useMetricLatestAvailableTime';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';

const GenericAnalyticsDataLastUpdatedOnDisclaimer: FC<{ metric: RAQIV2Metric }> = ({ metric }) => {
  const { data: lastUpdatedTime } = useMetricLatestAvailableTime(metric);
  const { translate } = useRAQIV2TranslationDependencies();
  const locale = useLocale();

  const message = lastUpdatedTime
    ? translate(translationKey('Message.DataLastUpdatedOn', TranslationNamespace.Analytics), {
        time: dateTimeFormatter(locale).getCustomDateTime(lastUpdatedTime, {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        }),
      })
    : null;

  return <Typography variant='body1'>{message}</Typography>;
};

export default GenericAnalyticsDataLastUpdatedOnDisclaimer;

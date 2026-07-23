import type { FC } from 'react';
import React, { useMemo } from 'react';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { AnalyticsAlertDetail } from '../constants/types';
import useAnalyticsAlertCurrentValueQuery from '../hooks/useAnalyticsAlertCurrentValueQuery';
import { formatCurrentValueLines } from '../utils/analyticsAlertFormUtils';

const LOADING_PLACEHOLDER = '\u2014';

const ActiveAlertCurrentValueCell: FC<{ alert: AnalyticsAlertDetail }> = ({ alert }) => {
  const translationDependencies = useRAQIV2TranslationDependencies();
  const { translate } = translationDependencies;
  const { data, isDataLoading } = useAnalyticsAlertCurrentValueQuery(alert);

  const lines = useMemo(
    () =>
      formatCurrentValueLines(
        data?.response?.values,
        alert.metric,
        translationDependencies,
        alert.condition.evaluationMode,
      ),
    [data, alert.metric, alert.condition.evaluationMode, translationDependencies],
  );

  // `useAnalyticsAlertCurrentValueQuery` polls on the alert's granularity
  // step, and `useApiRequest` flips `isDataLoading` back to `true` on every
  // refetch. Render the last-known `lines` whenever they exist so the column
  // doesn't flash the em-dash placeholder on each poll; only fall through to
  // the placeholder/no-data copy when there is nothing to display.
  if (lines.length > 0) {
    return (
      <>
        {lines.map((line, index) => (
          // eslint-disable-next-line react/no-array-index-key -- formatted line text may repeat across breakdown values; index disambiguates
          <div key={`${alert.alertId}-current-value-${index}`}>{line}</div>
        ))}
      </>
    );
  }

  if (isDataLoading) {
    return <span>{LOADING_PLACEHOLDER}</span>;
  }

  return <>{translate(translationKey('Label.NoData', TranslationNamespace.Analytics))}</>;
};

export default React.memo(ActiveAlertCurrentValueCell);

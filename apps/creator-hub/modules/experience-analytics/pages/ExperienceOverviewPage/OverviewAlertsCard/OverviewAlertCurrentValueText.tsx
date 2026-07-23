import type { FC, ReactNode } from 'react';
import { useMemo } from 'react';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { AnalyticsAlertDetail } from '@modules/experience-alerts/constants/types';
import useAnalyticsAlertCurrentValueQuery from '@modules/experience-alerts/hooks/useAnalyticsAlertCurrentValueQuery';
import { formatCurrentValueLines } from '@modules/experience-alerts/utils/analyticsAlertFormUtils';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const LOADING_PLACEHOLDER = '\u2014';

/**
 * Inline alert "current value" string for the compact Alerts card. Wraps the
 * same `useAnalyticsAlertCurrentValueQuery` + `formatCurrentValueLines` path
 * the active-alerts table uses, but joins breakdown lines with ", " so the
 * value fits on a single line inside the row's body sentence.
 */
const OverviewAlertCurrentValueText: FC<{ alert: AnalyticsAlertDetail }> = ({ alert }) => {
  const translationDependencies = useRAQIV2TranslationDependencies();
  const { translate } = translationDependencies;
  const { data, isDataLoading, isResponseFailed } = useAnalyticsAlertCurrentValueQuery(alert);

  const inlineValue: ReactNode = useMemo(() => {
    if (isDataLoading) {
      return LOADING_PLACEHOLDER;
    }
    const lines = formatCurrentValueLines(
      data?.response?.values,
      alert.metric,
      translationDependencies,
      alert.condition.evaluationMode,
    );
    if (isResponseFailed || lines.length === 0) {
      return translate(translationKey('Label.NoData', TranslationNamespace.Analytics));
    }
    return lines.join(', ');
  }, [
    alert.metric,
    alert.condition.evaluationMode,
    data,
    isDataLoading,
    isResponseFailed,
    translate,
    translationDependencies,
  ]);

  return <>{inlineValue}</>;
};

export default OverviewAlertCurrentValueText;

import type { FC } from 'react';
import { useMemo } from 'react';
import { useFlag } from '@rbx/flags';
import { withTranslation } from '@rbx/intl';
import { isFunnelCohortCompletionRateEnabled as isFunnelCohortCompletionRateEnabledFlag } from '@generated/flags/creatorAnalytics';
import { RecommendedEventType } from '@modules/clients/analytics';
import LiveEventsDialogProvider from '@modules/experience-analytics-shared/components/LiveEvents/LiveEventsDialogProvider';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import getFunnelPageConfig from './funnelPageConfig';

const FunnelsPageContent: FC = () => {
  const { ready, value: isFunnelCohortCompletionRateEnabledValue } = useFlag(
    isFunnelCohortCompletionRateEnabledFlag,
  );
  const isFunnelCohortCompletionRateEnabled = ready && isFunnelCohortCompletionRateEnabledValue;
  const funnelPageConfig = useMemo(
    () => getFunnelPageConfig(isFunnelCohortCompletionRateEnabled),
    [isFunnelCohortCompletionRateEnabled],
  );

  return (
    <LiveEventsDialogProvider defaultEventType={RecommendedEventType.ProgressionEvents}>
      <CreatorAnalyticsLayout config={funnelPageConfig} />
    </LiveEventsDialogProvider>
  );
};

export default withTranslation(FunnelsPageContent, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
]);

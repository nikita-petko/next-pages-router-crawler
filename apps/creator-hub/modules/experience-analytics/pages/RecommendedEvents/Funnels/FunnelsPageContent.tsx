import type { FC } from 'react';
import { withTranslation } from '@rbx/intl';
import { RecommendedEventType } from '@modules/clients/analytics';
import LiveEventsDialogProvider from '@modules/experience-analytics-shared/components/LiveEvents/LiveEventsDialogProvider';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import getFunnelPageConfig from './funnelPageConfig';

const funnelPageConfig = getFunnelPageConfig();

const FunnelsPageContent: FC = () => {
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

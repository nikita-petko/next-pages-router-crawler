import type { FC } from 'react';
import { withTranslation } from '@rbx/intl';
import { RecommendedEventType } from '@modules/clients/analytics';
import LiveEventsDialogProvider from '@modules/experience-analytics-shared/components/LiveEvents/LiveEventsDialogProvider';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import economyPageConfig from './economyPageConfig';

const EconomyPageContent: FC = () => {
  return (
    <LiveEventsDialogProvider defaultEventType={RecommendedEventType.EconomyEvents}>
      <CreatorAnalyticsLayout config={economyPageConfig} />
    </LiveEventsDialogProvider>
  );
};

export default withTranslation(EconomyPageContent, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
]);

import React, { FC } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation } from '@rbx/intl';

import {
  CreatorAnalyticsLayout,
  LiveEventsDialogProvider,
} from '@modules/experience-analytics-shared';
import { RecommendedEventType } from '@modules/clients/analytics';
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

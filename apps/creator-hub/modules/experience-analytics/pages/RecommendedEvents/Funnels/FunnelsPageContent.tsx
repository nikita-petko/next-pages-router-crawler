import React, { FC } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation } from '@rbx/intl';

import {
  LiveEventsDialogProvider,
  CreatorAnalyticsLayout,
} from '@modules/experience-analytics-shared';
import { RecommendedEventType } from '@modules/clients/analytics';
import funnelPageConfig from './funnelPageConfig';

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

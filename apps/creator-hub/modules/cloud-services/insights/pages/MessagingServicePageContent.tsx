import React, { FunctionComponent } from 'react';

import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { AnalyticsFlagGatedContext } from '@modules/experience-analytics-shared';
import MessagingServiceAnalyticsContainer from '../components/MessagingServiceAnalyticsContainer';

const MessagingServicePage: FunctionComponent = () => {
  return (
    <AnalyticsFlagGatedContext flag='showMessagingServiceDashboard'>
      <MessagingServiceAnalyticsContainer />
    </AnalyticsFlagGatedContext>
  );
};

export default withTranslation(MessagingServicePage, [TranslationNamespace.CloudServices]);

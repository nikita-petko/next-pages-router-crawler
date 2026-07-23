import React, { FunctionComponent } from 'react';

import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { AnalyticsFlagGatedContext } from '@modules/experience-analytics-shared';
import HttpServiceAnalyticsContainer from '../components/HttpServiceAnalyticsContainer';

const HttpServicePage: FunctionComponent = () => {
  return (
    <AnalyticsFlagGatedContext flag='showHttpServiceDashboard'>
      <HttpServiceAnalyticsContainer />
    </AnalyticsFlagGatedContext>
  );
};

export default withTranslation(HttpServicePage, [TranslationNamespace.CloudServices]);

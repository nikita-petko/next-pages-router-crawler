import type { FunctionComponent } from 'react';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import HttpServiceAnalyticsContainer from '../components/HttpServiceAnalyticsContainer';

const HttpServicePage: FunctionComponent = () => {
  return <HttpServiceAnalyticsContainer />;
};

export default withTranslation(HttpServicePage, [TranslationNamespace.CloudServices]);

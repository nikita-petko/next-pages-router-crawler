import type { FunctionComponent } from 'react';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import MessagingServiceAnalyticsContainer from '../components/MessagingServiceAnalyticsContainer';

const MessagingServicePage: FunctionComponent = () => {
  return <MessagingServiceAnalyticsContainer />;
};

export default withTranslation(MessagingServicePage, [TranslationNamespace.CloudServices]);

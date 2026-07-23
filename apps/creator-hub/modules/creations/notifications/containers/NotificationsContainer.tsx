import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation } from '@rbx/intl';
import React, { FC } from 'react';
import NotificationsContentContainer from '../notificationContent/containers/NotificationsContentContainer';

const NotificationsContainer: FC<React.PropsWithChildren<unknown>> = () => {
  return <NotificationsContentContainer />;
};

export default withTranslation(NotificationsContainer, [
  TranslationNamespace.Error,
  TranslationNamespace.Notifications,
]);

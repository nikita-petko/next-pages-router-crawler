import type { FC } from 'react';
import React from 'react';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import NotificationsContentContainer from '../notificationContent/containers/NotificationsContentContainer';

const NotificationsContainer: FC<React.PropsWithChildren> = () => {
  return <NotificationsContentContainer />;
};

export default withTranslation(NotificationsContainer, [
  TranslationNamespace.Error,
  TranslationNamespace.Notifications,
]);

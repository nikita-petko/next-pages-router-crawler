import React, { FunctionComponent } from 'react';
import Router from 'next/router';
import { useAuthentication } from '@modules/authentication/providers';
import { NotificationBellV2 } from '@rbx/creator-hub-navigation';

const onSettingsClick = () => {
  Router.push('/settings/notifications');
};

const NotificationTray: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { user } = useAuthentication();

  if (user === null) {
    return null;
  }

  return <NotificationBellV2 user={user} onSettingsClick={onSettingsClick} />;
};

export default NotificationTray;

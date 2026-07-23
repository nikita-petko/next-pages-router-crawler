import Router from 'next/router';
import type { FunctionComponent } from 'react';
import React from 'react';
import { NotificationBellV2 } from '@rbx/creator-hub-navigation';
import { useAuthentication } from '@modules/authentication/providers';

const onSettingsClick = () => {
  Router.push('/settings/notifications');
};

const NotificationTray: FunctionComponent<React.PropsWithChildren> = () => {
  const { user } = useAuthentication();

  if (user === null) {
    return null;
  }

  return <NotificationBellV2 user={user} onSettingsClick={onSettingsClick} />;
};

export default NotificationTray;

import React, { FunctionComponent } from 'react';
import { useRobloxAuthentication } from '@rbx/auth';
import NotificationBell from '../../notificationTray/NotificationBell';

const NotificationTray: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { user } = useRobloxAuthentication();

  return <NotificationBell user={user} />;
};

export default NotificationTray;

import React, { createContext, useContext, useMemo } from 'react';
import { CreatorStreamNotificationsApi } from '@rbx/client-creator-notification-streams-api/v1';
import { Configuration } from '@rbx/clients-core';
import useNavigationConfigs from '../../hooks/useNavigationConfigs';
import { getBEDEV2ServiceBasePath } from '../../utils/getBasePaths';
import getRobloxSiteDomain from '../../utils/getRobloxSiteDomain';

type TNotificationClientContext = {
  notificationClient?: CreatorStreamNotificationsApi;
};

export const NOTIFICATION_CLIENT_PAGE_SIZE = 15;

export const NotificationClientContext = createContext<TNotificationClientContext>({});

export const NotificationClientProvider: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const { environment, target } = useNavigationConfigs();
  const notificationClient = useMemo(() => {
    const basePath = getBEDEV2ServiceBasePath('creator-notifications', target, environment);

    const configuration = new Configuration({
      robloxSiteDomain: getRobloxSiteDomain(target, environment),
      basePath,
      credentials: 'include',
      enableMrRouter: true,
    });

    const notificationClientApi = new CreatorStreamNotificationsApi(configuration);
    return notificationClientApi;
  }, [environment, target]);

  const value = useMemo(
    () => ({
      notificationClient,
    }),
    [notificationClient],
  );

  return (
    <NotificationClientContext.Provider value={value}>
      {children}
    </NotificationClientContext.Provider>
  );
};

export const useNotificationClient = () => {
  const context = useContext(NotificationClientContext);
  if (context.notificationClient == null) {
    throw new Error('useNotificationClient must be used within a NotificationClientProvider');
  }

  return context;
};

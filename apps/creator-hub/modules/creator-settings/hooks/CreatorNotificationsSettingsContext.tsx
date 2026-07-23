import React, { createContext, FunctionComponent, useCallback, useMemo, useState } from 'react';
import { CreatorNotificationCategory } from '@rbx/clients/creatorSettings';
import { creatorSettingsClient } from '@modules/clients';
import { useAuthentication } from '@modules/authentication/providers';
import { sortNotificationsSettings } from '../notifications-settings/utils/sortNotificationsSettings';

export interface TCreatorNotificationsSettingsContext {
  notificationSettings: CreatorNotificationCategory[];
  notificationsSettingsContextStored: boolean;
  notificationSettingsFailedToLoad: boolean;
  notificationSettingsContextLoading: boolean;
  getNotificationSettings: () => void;
  setNotificationSettings: React.Dispatch<React.SetStateAction<CreatorNotificationCategory[]>>;
}

export const CreatorNotificationsSettingsContext =
  createContext<TCreatorNotificationsSettingsContext>({
    notificationSettings: [],
    notificationsSettingsContextStored: false,
    notificationSettingsFailedToLoad: false,
    notificationSettingsContextLoading: true,
    getNotificationSettings: () => {
      // do nothing
    },
    setNotificationSettings: () => {
      // also do nothing
    },
  });

const CreatorNotificationsSettingsProvider: FunctionComponent<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  const { user } = useAuthentication();
  const [currentNotificationSettings, setCurrentNotificationSettings] = useState<
    CreatorNotificationCategory[]
  >([]);
  const [stored, setStored] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [failedtoLoad, setFailedToLoad] = useState<boolean>(false);

  const getSettings = useCallback(async () => {
    if (stored || user?.id == null) {
      return;
    }
    try {
      setFailedToLoad(false);
      setLoading(true);
      const creatorSettings = await creatorSettingsClient.getCreatorSettings(user.id.toString());
      const sortedSettings = sortNotificationsSettings(creatorSettings.categories || []);
      setCurrentNotificationSettings(sortedSettings);
      setStored(true);
    } catch {
      setFailedToLoad(true);
      setStored(false);
    } finally {
      setLoading(false);
    }
  }, [user?.id, stored]);

  const contextValue = useMemo(
    () => ({
      notificationSettings: currentNotificationSettings,
      notificationsSettingsContextStored: stored,
      notificationSettingsFailedToLoad: failedtoLoad,
      notificationSettingsContextLoading: loading,
      getNotificationSettings: getSettings,
      setNotificationSettings: setCurrentNotificationSettings,
    }),
    [currentNotificationSettings, failedtoLoad, getSettings, loading, stored],
  );

  return (
    <CreatorNotificationsSettingsContext.Provider value={contextValue}>
      {children}
    </CreatorNotificationsSettingsContext.Provider>
  );
};

export default CreatorNotificationsSettingsProvider;

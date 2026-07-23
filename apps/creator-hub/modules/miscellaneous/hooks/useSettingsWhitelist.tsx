import { useAuthentication } from '@modules/authentication/providers';
import { TSettings, useSettings } from '@modules/settings';
import { useMemo } from 'react';

/**
 * Hook that returns a boolean indicating if the current user is in the whitelist of the specified settings key.
 * @param settingsKey The settings key corresponding to the semicolon-separated string list of user IDs.
 * @returns A boolean indicating if the current user is in the whitelist of the specified settings key.
 */
const useSettingsWhitelist = (settingsKey: keyof TSettings): boolean => {
  const { settings: fetchedSettings, isFetched: settingsFetched } = useSettings();
  const { user, isFetched: isAuthFetched } = useAuthentication();

  const inWhiteList = useMemo(() => {
    if (!isAuthFetched || !settingsFetched) {
      return false;
    }

    const userId = user?.id?.toString();
    if (userId && fetchedSettings?.[settingsKey]) {
      const value = fetchedSettings[settingsKey];
      if (typeof value === 'string') {
        const whitelist = value.split(';');
        return whitelist.includes(userId);
      }
    }

    return false;
  }, [isAuthFetched, settingsFetched, user?.id, fetchedSettings, settingsKey]);

  return inWhiteList;
};

export default useSettingsWhitelist;

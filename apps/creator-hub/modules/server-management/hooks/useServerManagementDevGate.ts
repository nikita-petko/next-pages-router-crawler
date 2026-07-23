import { useMemo } from 'react';
import useSettingsWhitelist from '@modules/miscellaneous/hooks/useSettingsWhitelist';
import { FeatureFlagName } from '@modules/settings/SettingsProvider/featureFlags';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';

const useServerManagementDevGate = (): boolean => {
  const { settings, isFetched } = useSettings();
  const inAllowlist = useSettingsWhitelist(
    FeatureFlagName.serverManagementDevAllowlist as keyof typeof settings,
  );

  return useMemo(
    () => isFetched && (settings.serverManagementShowServerLogs || inAllowlist),
    [settings.serverManagementShowServerLogs, isFetched, inAllowlist],
  );
};

export default useServerManagementDevGate;

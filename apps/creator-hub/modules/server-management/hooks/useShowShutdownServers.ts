import useSettingsWhitelist from '@modules/miscellaneous/hooks/useSettingsWhitelist';
import { FeatureFlagName } from '@modules/settings/SettingsProvider/featureFlags';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';

const useShowShutdownServers = (): boolean => {
  const { settings, isFetched } = useSettings();
  const inAllowlist = useSettingsWhitelist(
    FeatureFlagName.serverManagementDevAllowlist as keyof typeof settings,
  );

  return isFetched && (settings.serverManagementShowShutdownServers || inAllowlist);
};

export default useShowShutdownServers;

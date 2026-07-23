import { useMemo } from 'react';
import { useSettings, FeatureFlagName } from '@modules/settings';
import useSettingsWhitelist from '@modules/miscellaneous/hooks/useSettingsWhitelist';

const useServerManagementV2Gate = (): boolean => {
  const { settings, isFetched } = useSettings();
  const inWhitelist = useSettingsWhitelist(
    FeatureFlagName.serverManagementV2Whitelist as keyof typeof settings,
  );

  return useMemo(
    () => isFetched && (!!settings?.serverManagementV2Enabled || inWhitelist),
    [isFetched, settings?.serverManagementV2Enabled, inWhitelist],
  );
};

export default useServerManagementV2Gate;

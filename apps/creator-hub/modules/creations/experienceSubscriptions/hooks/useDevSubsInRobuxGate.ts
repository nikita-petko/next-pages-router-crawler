import { useMemo } from 'react';
import { useSettings, FeatureFlagName } from '@modules/settings';
import useSettingsWhitelist from '@modules/miscellaneous/hooks/useSettingsWhitelist';

const useDevSubsInRobuxGate = (): boolean => {
  const { settings, isFetched } = useSettings();
  const inAllowlist = useSettingsWhitelist(
    FeatureFlagName.devSubsInRobuxAllowlist as keyof typeof settings,
  );

  return useMemo(
    () => isFetched && (!!settings?.enableDeveloperSubscriptionsInRobux || inAllowlist),
    [isFetched, settings?.enableDeveloperSubscriptionsInRobux, inAllowlist],
  );
};

export default useDevSubsInRobuxGate;

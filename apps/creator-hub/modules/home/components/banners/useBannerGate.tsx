import { useMemo } from 'react';
import { useSettings, FeatureFlagName } from '@modules/settings';
import useSettingsWhitelist from '@modules/miscellaneous/hooks/useSettingsWhitelist';

const useBannerGate = (bannerName: string): boolean => {
  const inBannerWhitelist = useSettingsWhitelist(
    'personalizationBannerWhitelist' as FeatureFlagName,
  );
  const { settings, isFetched: settingsFetched } = useSettings();

  const isAllowed = useMemo(() => {
    if (!settingsFetched || !bannerName) {
      return false;
    }

    if (settings?.personalizationBannerIdsGated) {
      const gatedBanners = settings.personalizationBannerIdsGated.split(';');
      if (gatedBanners.includes(bannerName)) {
        return inBannerWhitelist;
      }
    }

    return true;
  }, [bannerName, inBannerWhitelist, settings.personalizationBannerIdsGated, settingsFetched]);

  return isAllowed;
};

export default useBannerGate;

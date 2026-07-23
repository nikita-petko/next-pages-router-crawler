import { useEffect, useState } from 'react';
import { getAllowedMarketplaceItemTypes } from '@modules/creations/menu/constants/MenuConstants';
import { Asset } from '@modules/miscellaneous/common';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';

/**
 * Returns whether the current creator can access the Creations > Avatar Items > Backgrounds sub-tab.
 * This is the same condition used to gate that sub-tab: the enableAvatarBackgrounds setting must be
 * on AND AvatarBackground must be in the allowed marketplace asset types. Used to gate the upload-CTA
 * enhancements for non-avatar-background asset types so only Backgrounds-eligible creators see them.
 */
const useAvatarBackgroundAccess = (): boolean => {
  const { settings } = useSettings();
  const [hasAllowedBackground, setHasAllowedBackground] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    getAllowedMarketplaceItemTypes()
      .then(({ assetTypes }) => {
        if (!cancelled) {
          setHasAllowedBackground(assetTypes.has(Asset.AvatarBackground));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHasAllowedBackground(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return settings.enableAvatarBackgrounds && hasAllowedBackground;
};

export default useAvatarBackgroundAccess;

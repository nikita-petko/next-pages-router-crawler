import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { TGroup } from '@modules/authentication/types';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import useAvatarLooksGate from '../../home/hooks/useAvatarLooksGate';
import useUGCFoldersGate from '../../home/hooks/useUGCFoldersGate';
import useMomentsGate from '../../moments/hooks/useMomentsGate';
import useShowcasesGate from '../../showcase/hooks/useShowcasesGate';
import { getAvatarItemsEntryPointAssetTypes } from '../constants/MenuConstants';
import creationsMenuManager from '../implementations/CreationsMenuManager';
import type MenuItem from '../interfaces/MenuItem';
import type MenuState from '../interfaces/MenuState';

/**
 * The submenu entries the current user may actually see, in render order.
 *
 * Several entries are gated — Avatars on a server-side setting, Moments and All Asset Types on their
 * own flags, and the marketplace types on the creator's allowed types — so the raw menu definition
 * is not what ends up on screen. Anything choosing a tab on the user's behalf has to pick from this
 * list rather than the definition, or it can land them on a tab that is not there.
 */
const useEnabledSubmenuItems = (menuState: MenuState, group: TGroup | null): MenuItem[] => {
  const { settings } = useSettings();
  const isMomentsTabEnabled = useMomentsGate();
  const isUGCFoldersEnabled = useUGCFoldersGate();
  const isAvatarLooksEnabled = useAvatarLooksGate();
  const isShowcasesEnabled = useShowcasesGate();

  // The entry-point set rather than the publish-permitted one: Avatar Backgrounds are uploadable
  // without being publish-permitted, and the tab row keys off what can be entered. Cached by
  // react-query so the row and the toolbar share a single fetch.
  const { data: allowedAssetTypes } = useQuery({
    queryKey: ['avatar-items-entry-point-asset-types'],
    queryFn: getAvatarItemsEntryPointAssetTypes,
    staleTime: 5 * 60 * 1000,
  });

  return useMemo(
    () =>
      menuState.menuItem.submenuItems?.filter((submenuItem) =>
        creationsMenuManager.isMenuItemEnabled(
          submenuItem,
          settings,
          group,
          // Only set isMarketplaceAssetType on the Avatar Items menu.
          menuState.menuItem.nameKey === 'Label.AvatarItems'
            ? allowedAssetTypes?.has(submenuItem.type)
            : undefined,
          allowedAssetTypes,
          isMomentsTabEnabled,
          isUGCFoldersEnabled,
          isAvatarLooksEnabled,
          isShowcasesEnabled,
        ),
      ) ?? [],
    [
      menuState.menuItem.submenuItems,
      menuState.menuItem.nameKey,
      settings,
      group,
      allowedAssetTypes,
      isMomentsTabEnabled,
      isUGCFoldersEnabled,
      isAvatarLooksEnabled,
      isShowcasesEnabled,
    ],
  );
};

export default useEnabledSubmenuItems;

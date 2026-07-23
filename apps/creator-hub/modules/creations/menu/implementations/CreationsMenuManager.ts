import { is2DAsset } from '@modules/asset-creation/constants/AssetTypeConstants';
import type { TGroup } from '@modules/authentication/types';
import {
  Asset,
  assetFullNameKeys,
  Item,
  itemFullNameKeys,
  assetTypeToItemType,
} from '@modules/miscellaneous/common';
import type { TSettings } from '@modules/settings/SettingsProvider/settingsHelpers';
import { AvatarMenuMap } from '../../avatarItem/constants/avatarItemConstants';
import MenuItems, {
  allowedAssetTypesForDirectArchiving,
  allowedAssetTypesForArchiving,
  allowedItemTypesForUploading,
  allowedAssetTypesForSorting,
} from '../constants/MenuConstants';
import type MenuItem from '../interfaces/MenuItem';
import type MenuManager from '../interfaces/MenuManager';
import type MenuState from '../interfaces/MenuState';

const assetsToMenuState = MenuItems.reduce((map, menuItem) => {
  if (!menuItem.submenuItems) {
    map.set(menuItem.type, { menuItem });
  }
  menuItem.submenuItems?.forEach((submenuItem) => {
    if (!submenuItem.submenuItems) {
      map.set(submenuItem.type, { menuItem, submenuItem });
    } else {
      submenuItem.submenuItems?.forEach((superSubmenuItem) => {
        map.set(superSubmenuItem.type, { menuItem, submenuItem });
      });
    }
  });

  return map;
}, new Map<Asset, MenuState>());

const DEFAULT_MENU_STATE = { menuItem: MenuItems[0] };

const MAKEUP_FIRST_ASSET_TYPE = Asset.EyeMakeup;
const AVATAR_LOOKS_ASSET_TYPE = Asset.AvatarLooks;
const AVATAR_BACKGROUND_ASSET_TYPE = Asset.AvatarBackground;

const creationsMenuManager: MenuManager = {
  isMenuItemEnabled(
    menuItem: MenuItem | undefined,
    settings: TSettings,
    // NOTE (jcountryman, 04/17/24): Disabled to check in settings deletion
    // Codeowner is responsible for fixing errors.
    group: TGroup | null,
    isMarketplaceAssetType?: boolean,
    allowedAssetTypes?: Set<Asset>,
    isMomentsTabEnabled?: boolean,
    isUGCFoldersEnabled?: boolean,
    isAvatarLooksEnabled?: boolean | null,
  ): boolean {
    if (menuItem?.type === Asset.AllCatalogAsset) {
      return isUGCFoldersEnabled ?? false;
    }
    // for the time being, only user owned experiences can be shared for edit and show up in "shared with me"
    if (menuItem?.type === Asset.SharedExperiences) {
      return group == null;
    }
    if (menuItem?.type === Asset.Moments) {
      return isMomentsTabEnabled ?? false;
    }
    if (menuItem?.itemType === Item.Bundle) {
      return true;
    }
    if (menuItem?.type === AVATAR_LOOKS_ASSET_TYPE) {
      return isAvatarLooksEnabled ?? false;
    }
    if (menuItem?.type === AVATAR_BACKGROUND_ASSET_TYPE) {
      return settings.enableAvatarBackgrounds && (allowedAssetTypes?.has(menuItem.type) ?? false);
    }
    if (menuItem?.type === MAKEUP_FIRST_ASSET_TYPE) {
      return (
        settings.enableMakeupAssets && (allowedAssetTypes?.has(menuItem?.type as Asset) ?? false)
      );
    }

    if (menuItem?.type !== undefined) {
      if (is2DAsset(menuItem?.type)) {
        return true;
      }

      // This is for the main menu items (e.g. Experiences, Share Links, etc.)
      if ((menuItem?.type as Asset) !== undefined && isMarketplaceAssetType === undefined) {
        return true;
      }
      return isMarketplaceAssetType ?? false;
    }
    return true;
  },

  getValidMenuState(
    menuItems: MenuItem[],
    menuState: MenuState,
    settings: TSettings,
    group: TGroup | null,
    isMarketplaceAssetType?: boolean,
    allowedAssetTypes?: Set<Asset>,
    isMomentsTabEnabled?: boolean,
    isUGCFoldersEnabled?: boolean,
    isAvatarLooksEnabled?: boolean | null,
  ): MenuState {
    let validMenuItem;
    let validSubmenuItem;

    // For menu items that depend on allowedAssetTypes (like Makeup), only validate if allowedAssetTypes is available
    // This prevents invalidating the selection on initial load before the API call completes
    const shouldValidateSubmenuItem =
      menuState.submenuItem?.type === MAKEUP_FIRST_ASSET_TYPE ||
      menuState.submenuItem?.type === AVATAR_BACKGROUND_ASSET_TYPE
        ? allowedAssetTypes !== undefined
        : true;

    if (
      typeof menuState.menuItem !== 'undefined' &&
      !this.isMenuItemEnabled(
        menuState.menuItem,
        settings,
        group,
        isMarketplaceAssetType,
        allowedAssetTypes,
        isMomentsTabEnabled,
        isUGCFoldersEnabled,
        isAvatarLooksEnabled,
      )
    ) {
      [validMenuItem] = menuItems;
      validSubmenuItem = menuItems[0].submenuItems?.[0];
    } else if (
      typeof menuState.submenuItem !== 'undefined' &&
      shouldValidateSubmenuItem &&
      !this.isMenuItemEnabled(
        menuState.submenuItem,
        settings,
        group,
        isMarketplaceAssetType,
        allowedAssetTypes,
        isMomentsTabEnabled,
        isUGCFoldersEnabled,
        isAvatarLooksEnabled,
      )
    ) {
      if (menuState.menuItem.submenuItems !== undefined) {
        let validSubmenuIndex = 0;
        let submenuSeekIndex = 0;
        while (submenuSeekIndex < menuState.menuItem.submenuItems?.length) {
          if (
            this.isMenuItemEnabled(
              menuState.menuItem.submenuItems[submenuSeekIndex],
              settings,
              group,
              isMarketplaceAssetType,
              allowedAssetTypes,
              isMomentsTabEnabled,
              isUGCFoldersEnabled,
              isAvatarLooksEnabled,
            )
          ) {
            validSubmenuIndex = submenuSeekIndex;
            break;
          }
          submenuSeekIndex += 1;
        }
        validMenuItem = menuState.menuItem;
        validSubmenuItem = menuState.menuItem.submenuItems?.[validSubmenuIndex];
      } else {
        validMenuItem = menuState.menuItem;
        validSubmenuItem = menuState.menuItem.submenuItems?.[0];
      }
    }

    if (validMenuItem) {
      return {
        menuItem: validMenuItem,
        submenuItem: validSubmenuItem,
      };
    }
    return menuState;
  },
  // Certain assets can be archived, but only by archiving their associated composite assets
  isAssetTypeDirectlyArchivable(type: Asset): boolean {
    return allowedAssetTypesForDirectArchiving.has(type);
  },
  isAssetTypeArchivable(type: Asset, filterIndex?: number): boolean {
    if (filterIndex !== undefined && AvatarMenuMap[type]) {
      const menuOptions = AvatarMenuMap[type];
      const selectedOption = menuOptions[filterIndex];
      const selectedAssetType = selectedOption?.assetType;

      // All bundle types are archivable
      return (
        selectedOption?.bundleType !== undefined ||
        (selectedAssetType !== undefined && allowedAssetTypesForArchiving.has(selectedAssetType))
      );
    }
    return allowedAssetTypesForArchiving.has(type);
  },
  isAssetTypeSortable(type: Asset): boolean {
    // Currently only places are sortable
    return allowedAssetTypesForSorting.has(type);
  },
  isItemTypeUploadable(type: Item): boolean {
    return allowedItemTypesForUploading.has(type);
  },
  getAssetFullNameKey(type: Asset): string {
    return assetFullNameKeys[type];
  },
  getItemFullNameKey(type: Item): string {
    return itemFullNameKeys[type];
  },
  getAssetType(menuState: MenuState): Asset {
    if (menuState.submenuItem) {
      return menuState.submenuItem.type;
    }

    return menuState.menuItem.type;
  },
  getItemType(menuState: MenuState): Item {
    if (menuState.submenuItem && menuState.submenuItem.itemType) {
      return menuState.submenuItem.itemType;
    }

    if (menuState.menuItem.itemType) {
      return menuState.menuItem.itemType;
    }

    return assetTypeToItemType[this.getAssetType(menuState)];
  },
  getMenuState(type: Asset | undefined, filteredTypes: Asset[]): MenuState {
    if (type && filteredTypes.includes(type)) {
      return DEFAULT_MENU_STATE;
    }

    return type ? (assetsToMenuState.get(type) ?? DEFAULT_MENU_STATE) : DEFAULT_MENU_STATE;
  },
};

export default creationsMenuManager;

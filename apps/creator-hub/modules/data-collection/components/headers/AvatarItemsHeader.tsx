import type { ChangeEvent, FC, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Chip, Grid, Typography, useMediaQuery } from '@rbx/ui';
import DropdownField from '@modules/commerce/components/DropdownField';
import {
  AvatarMenuMap,
  BundleType,
  type AvatarItemDropdown,
} from '@modules/creations/avatarItem/constants/avatarItemConstants';
import menuItems, {
  getAllowedMarketplaceItemTypes,
} from '@modules/creations/menu/constants/MenuConstants';
import creationsMenuManager from '@modules/creations/menu/implementations/CreationsMenuManager';
import type MenuItem from '@modules/creations/menu/interfaces/MenuItem';
import { translateBundleTypeToBundleTypeString } from '@modules/creations/unifiedFeeSystem/helper/UnifiedFeeSystemHelper';
import { Asset, Item } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import CreatorSelect from '../common/CreatorSelect';
import useHeaderStyles from './Header.styles';

export enum BundleTypeOption {
  Unknown = 'Unknown',
  Body = 'Body',
  DynamicHead = 'DynamicHead',
  Shoes = 'Shoes',
}

interface AvatarItemsHeaderProps {
  itemType: Asset | BundleTypeOption | undefined;
  setItemType: (itemType: Asset | BundleTypeOption) => void;
  user: { id: number; name: string; displayName?: string };
  groups: { id: number; name: string }[];
  onGroupChange: (groupId: string) => void;
}

const mapMenuBundleToApiBundle = (bundleType?: BundleType): BundleTypeOption => {
  return translateBundleTypeToBundleTypeString(
    bundleType ?? BundleType.Unknown,
  ) as BundleTypeOption;
};

const mapAvatarItemDropdownToAssetOrBundleType = (dropdownItem: AvatarItemDropdown) => {
  const isBundleMenuItem = dropdownItem.itemType === Item.Bundle;
  const mappedItemType = isBundleMenuItem
    ? mapMenuBundleToApiBundle(dropdownItem.bundleType)
    : dropdownItem.assetType;
  return mappedItemType;
};

const AvatarItemsHeader: FC<AvatarItemsHeaderProps> = ({
  itemType,
  setItemType,
  user,
  groups,
  onGroupChange,
}) => {
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('Large'));
  const {
    classes: { container },
  } = useHeaderStyles();
  const { translate } = useTranslation();

  const group = useCurrentGroup();
  const { settings } = useSettings();

  const [pillSelection, setPillSelection] = useState<MenuItem | undefined>(undefined);
  const [allowedAssetTypes, setAllowedAssetTypes] = useState<Set<Asset>>(new Set<Asset>());
  useEffect(() => {
    (async () => {
      try {
        const { assetTypes } = await getAllowedMarketplaceItemTypes();
        setAllowedAssetTypes(assetTypes);
      } catch {
        setAllowedAssetTypes(new Set<Asset>());
      }
    })();
  }, []);

  const setPillState = useCallback(
    (state: MenuItem) => {
      setPillSelection(state);
      const firstDropdownOption = AvatarMenuMap[state.type]![0];
      setItemType(mapAvatarItemDropdownToAssetOrBundleType(firstDropdownOption)!);
    },
    [setItemType, setPillSelection],
  );

  const avatarMenuItems = useMemo(() => {
    if (allowedAssetTypes.size === 0) {
      return [];
    }

    const avatarItemsMenuSubmenuItems =
      menuItems.find((menuItem) => menuItem.type === Asset.TShirt)?.submenuItems ?? [];
    const filteredAvatarItemsMenuSubmenuItems = avatarItemsMenuSubmenuItems.filter(
      (menuItem) =>
        menuItem.type !== Asset.AllCatalogAsset &&
        creationsMenuManager.isMenuItemEnabled(
          menuItem,
          settings,
          group,
          allowedAssetTypes.has(menuItem.type),
        ),
    );

    return filteredAvatarItemsMenuSubmenuItems;
  }, [allowedAssetTypes, settings, group]);

  useEffect(() => {
    if (avatarMenuItems.length > 0) {
      setPillState(avatarMenuItems[0]);
    }
  }, [avatarMenuItems, setPillState]);

  const pills: ReactNode = useMemo(() => {
    return avatarMenuItems.map((menuItem) => {
      const isSelected = pillSelection?.nameKey === menuItem.nameKey;
      return (
        <Grid item key={menuItem.type}>
          <Chip
            size='large'
            label={translate(menuItem.nameKey)}
            clickable
            color={isSelected ? 'primary' : 'secondary'}
            onClick={() => {
              setPillState(menuItem);
            }}
            data-testid='chip-bodies'
          />
        </Grid>
      );
    });
  }, [avatarMenuItems, pillSelection, translate, setPillState]);

  const dropdownOptions = useMemo(() => {
    if (!pillSelection) {
      return [];
    }
    return AvatarMenuMap[pillSelection.type] ?? [];
  }, [pillSelection]);

  const dropdownSelection = useMemo(() => {
    return dropdownOptions.find(
      (dropdownItem) => mapAvatarItemDropdownToAssetOrBundleType(dropdownItem) === itemType,
    );
  }, [dropdownOptions, itemType]);

  return (
    <div className={container} data-testid='avatar-items-header-container'>
      {!isSm && (
        <Typography marginBottom={4} variant='body1' component='p'>
          {translate('Description.Bundles')}
        </Typography>
      )}
      <CreatorSelect groups={groups} user={user} onGroupChange={onGroupChange} />
      <Grid columnGap={1} columns={2} marginY={2} container>
        {pills}
      </Grid>
      <div style={{ width: '220px', marginTop: '1.5em' }}>
        <DropdownField
          size='small'
          selectionValue={dropdownSelection?.nameKey ?? ''}
          label={translate('Label.CategoryType', {
            categoryNameSingular: translate(pillSelection?.nameKey ?? ''),
          })}
          listOfInputs={dropdownOptions?.map((dropdownItem) => dropdownItem.nameKey)}
          handleChange={(event: ChangeEvent<{ value: string }>) => {
            const selectedItemNameKey = event.target.value;
            const selectedDropdownItem: AvatarItemDropdown = dropdownOptions.find(
              (dropdownItem) => dropdownItem.nameKey === selectedItemNameKey,
            )!;
            setItemType(mapAvatarItemDropdownToAssetOrBundleType(selectedDropdownItem)!);
          }}
        />
      </div>
    </div>
  );
};

export default withTranslation(AvatarItemsHeader, [
  TranslationNamespace.DataSharingSettingsV2,
  TranslationNamespace.Creations,
  TranslationNamespace.AssetTypes,
]);

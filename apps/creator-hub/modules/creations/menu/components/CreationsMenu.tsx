import type { ChangeEvent, FunctionComponent } from 'react';
import React, { useCallback, useMemo } from 'react';
import { useFlag } from '@rbx/flags';
import { useTranslation } from '@rbx/intl';
import { Tab, Tabs } from '@rbx/ui';
import { enableAvatarLooks } from '@generated/flags/avatarMarketplace';
import type { TGroup } from '@modules/authentication/types';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import useMomentsGate from '../../home/hooks/useMomentsGate';
import creationsMenuManager from '../implementations/CreationsMenuManager';
import type MenuItem from '../interfaces/MenuItem';
import type MenuState from '../interfaces/MenuState';
import useMenuStyles from './CreationsMenu.styles';

function isMenuItem(value: unknown): value is MenuItem {
  return typeof value === 'object' && value !== null && 'type' in value && 'nameKey' in value;
}

export interface CreationsMenuProps {
  menuItems: MenuItem[];
  menuState: MenuState;
  onMenuStateChange: (newState: MenuState) => void;
  group: TGroup | null;
  isMarketplaceAssetType?: boolean;
}

const CreationsMenu: FunctionComponent<React.PropsWithChildren<CreationsMenuProps>> = ({
  menuItems,
  menuState,
  onMenuStateChange,
  group,
  isMarketplaceAssetType,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { menuTab },
  } = useMenuStyles(menuItems.length)();
  const { settings } = useSettings();
  const isMomentsTabEnabled = useMomentsGate();
  const { value: isAvatarLooksEnabled } = useFlag(enableAvatarLooks);

  const getValidSubmenuItem = useCallback(
    (menuItem: MenuItem) => {
      if (menuItem.submenuItems) {
        for (let count = 0; count < menuItem.submenuItems?.length; count += 1) {
          if (
            creationsMenuManager.isMenuItemEnabled(
              menuItem.submenuItems[count],
              settings,
              group,
              isMarketplaceAssetType,
              undefined,
              isMomentsTabEnabled,
              undefined,
              isAvatarLooksEnabled,
            )
          ) {
            return count;
          }
        }
      }
      // We should have better handling - this represents our previous behavior of trusting the first item in
      // submenus, regardless of the isMenuItemEnabled check
      return 0;
    },
    [group, settings, isMarketplaceAssetType, isMomentsTabEnabled, isAvatarLooksEnabled],
  );

  const onMenuChange = useCallback(
    (event: ChangeEvent<unknown>, value: unknown) => {
      if (!isMenuItem(value)) {
        return;
      }
      const submenuItem = value.submenuItems?.[getValidSubmenuItem(value)];
      onMenuStateChange({ menuItem: value, submenuItem });
    },
    [getValidSubmenuItem, onMenuStateChange],
  );

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((menuItem) =>
      creationsMenuManager.isMenuItemEnabled(
        menuItem,
        settings,
        group,
        undefined,
        undefined,
        isMomentsTabEnabled,
        undefined,
        isAvatarLooksEnabled,
      ),
    );
  }, [menuItems, settings, group, isMomentsTabEnabled, isAvatarLooksEnabled]);

  return (
    <Tabs
      variant='scrollable'
      orientation='horizontal'
      value={menuState.menuItem}
      onChange={onMenuChange}>
      {filteredMenuItems.map((menuItem) => (
        <Tab
          key={menuItem.type}
          className={menuTab}
          value={menuItem}
          label={translate(menuItem.nameKey)}
        />
      ))}
    </Tabs>
  );
};

export default CreationsMenu;

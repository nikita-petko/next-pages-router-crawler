import React, { ChangeEvent, FunctionComponent, useCallback, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Tab, Tabs } from '@rbx/ui';
import type { TGroup } from '@modules/authentication/types';
import { useSettings } from '@modules/settings';
import MenuState from '../interfaces/MenuState';
import useMenuStyles from './CreationsMenu.styles';
import MenuItem from '../interfaces/MenuItem';
import creationsMenuManager from '../implementations/CreationsMenuManager';

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
    [group, settings, isMarketplaceAssetType],
  );

  const onMenuChange = useCallback(
    (event: ChangeEvent<unknown>, value: unknown) => {
      const menuItem = value as MenuItem;
      const submenuItem = menuItem.submenuItems?.[getValidSubmenuItem(menuItem)];
      onMenuStateChange({ menuItem, submenuItem });
    },
    [getValidSubmenuItem, onMenuStateChange],
  );

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((menuItem) =>
      creationsMenuManager.isMenuItemEnabled(menuItem, settings, group),
    );
  }, [menuItems, settings, group]);

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

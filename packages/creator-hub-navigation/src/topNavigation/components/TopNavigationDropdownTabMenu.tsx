import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import { makeStyles, Menu, MenuItem, Divider } from '@rbx/ui';
import { clickDropdownMenuItemEventModel } from '../../event/eventConstants';
import useNavigationConfigs from '../../hooks/useNavigationConfigs';
import type { NavigationTab } from '../constants/navigationConstants';
import { useTopNavigationDropdownTab } from './TopNavigationDropdownTabProvider';

export type TNavigationDropdownItem = {
  title: string;
  path: string;
};

interface TTopNavigationDropdownTabMenuProps {
  items: TNavigationDropdownItem[][];
}

const useTopNavigationStyles = makeStyles()(() => ({
  menuList: {
    pointerEvents: 'auto',
  },
  popoverStyle: {
    pointerEvents: 'none',
  },
}));

export const hasMenuItemHref = (
  itemPath: string | null | undefined,
  tab: NavigationTab | null,
): tab is NavigationTab => {
  return itemPath !== null && itemPath !== undefined && tab !== null;
};

export const getMenuItemHref = (baseUrl: string, path: string) => {
  if (path === '' || path === '/') {
    return baseUrl;
  }
  return `${baseUrl}/${path.replace(/^\//, '')}`;
};

const TopNavigationDropdownTabMenu: FunctionComponent<TTopNavigationDropdownTabMenuProps> = ({
  items,
}) => {
  const {
    anchorRef,
    buttonId,
    isLastMovementKeyboard,
    isMenuOpen,
    menuId,
    tab,
    setIsMenuOpen,
    onMouseEnterMenu,
    onMouseLeaveMenu,
    onKeyDownMenu,
  } = useTopNavigationDropdownTab();
  const { sendEvent } = useNavigationConfigs();

  const {
    classes: { popoverStyle, menuList },
  } = useTopNavigationStyles();

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, [setIsMenuOpen]);

  const onMenuItemClick = useCallback(
    (t: TNavigationDropdownItem) => {
      if (hasMenuItemHref(t.path, tab)) {
        sendEvent(clickDropdownMenuItemEventModel(tab.key, t.path));
        setTimeout(() => {
          closeMenu();
          window.open(getMenuItemHref(tab.href, t.path), '_self');
        }, 100);
      }
    },
    [closeMenu, sendEvent, tab],
  );

  return (
    <Menu
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      MenuListProps={{
        classes: { root: menuList },
        onMouseEnter: onMouseEnterMenu,
        onMouseLeave: onMouseLeaveMenu,
        onKeyDown: onKeyDownMenu,
      }}
      PopoverClasses={{
        root: popoverStyle,
      }}
      anchorEl={anchorRef}
      id={menuId}
      open={isMenuOpen}
      onClose={closeMenu}
      disableAutoFocusItem={!isLastMovementKeyboard}
      aria-labelledby={buttonId}
      role='menu'
      variant='menu'>
      {items.map((submenu, id) => {
        return [
          ...submenu.map((item) => (
            <MenuItem
              role='menuitem'
              onClick={(e) => {
                e.preventDefault();
                onMenuItemClick(item);
              }}
              key={item.title}
              component='a'
              href={
                hasMenuItemHref(item.path, tab) ? getMenuItemHref(tab.href, item.path) : undefined
              }>
              {item.title}
            </MenuItem>
          )),
          id < items.length - 1 ? <Divider /> : null,
        ];
      })}
    </Menu>
  );
};

export default TopNavigationDropdownTabMenu;

import React, { FunctionComponent, useCallback, useState, useEffect } from 'react';
import { makeStyles, Menu, MenuItem } from '@rbx/ui';
import { useTopNavigationDropdownTab } from './TopNavigationDropdownTabProvider';
import useNavigationConfigs from '../../hooks/useNavigationConfigs';
import { clickDropdownMenuItemEventModel } from '../../event/eventConstants';
import { NavigationTab } from '../constants/navigationConstants';
import NavigationTranslate from '../../hooks/NavigationTranslate';

const useTopNavigationStyles = makeStyles<{ menuMinWidth?: number }>()((_, { menuMinWidth }) => ({
  menu: {
    minWidth: menuMinWidth
  }
}));

const TopNavigationDropdownSubTabsContent: FunctionComponent = () => {
  const { anchorRef, isMenuOpen, setIsMenuOpen, tab: currentTab } = useTopNavigationDropdownTab();
  const { sendEvent } = useNavigationConfigs();
  const [menuMinWidth, setMenuMinWidth] = useState<number | undefined>();
  const {
    classes: { menu: menuStyle }
  } = useTopNavigationStyles({
    menuMinWidth
  });
  const subTabs = currentTab?.subTabs || [];

  useEffect(() => {
    if (anchorRef) {
      const rect = anchorRef.getBoundingClientRect();
      setMenuMinWidth(rect.width);
    }
  }, [anchorRef]);

  const onTabClick = useCallback(
    (tab: NavigationTab) => {
      sendEvent(clickDropdownMenuItemEventModel(currentTab?.key || '', tab.key));
      setTimeout(() => {
        window.open(tab.href, '_self');
      }, 100);
    },
    [currentTab, sendEvent]
  );

  return (
    <Menu
      PaperProps={{ className: menuStyle }}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left'
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left'
      }}
      open={isMenuOpen}
      anchorEl={anchorRef}
      onClose={() => setIsMenuOpen(false)}
      variant='menu'>
      {subTabs.map(tab => (
        <MenuItem
          component='a'
          href={tab.href}
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
            onTabClick(tab);
          }}
          key={tab.key}
          value={tab.key}>
          <NavigationTranslate content={tab.title} />
        </MenuItem>
      ))}
    </Menu>
  );
};

export default TopNavigationDropdownSubTabsContent;

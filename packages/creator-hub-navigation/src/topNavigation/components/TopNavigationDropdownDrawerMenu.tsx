import React, { FunctionComponent, useCallback } from 'react';
import { List, ListItemButton, Typography, Divider, Link, makeStyles } from '@rbx/ui';
import { getMenuItemHref, TNavigationDropdownItem } from './TopNavigationDropdownTabMenu';
import { clickDropdownMenuItemEventModel } from '../../event/eventConstants';
import useNavigationConfigs from '../../hooks/useNavigationConfigs';

interface MenuItem {
  path: string;
  title: string;
}

type DrawerTab = {
  key: string;
  href: string;
}

interface TopNavigationDropdownDrawerMenuProps {
  translatedItems: MenuItem[][];
  tab: DrawerTab;
}

const useStyles = makeStyles()(theme => ({
  listItem: {
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
  },
  dividerContainer: {
    padding: theme.spacing(0.5, 0),
  }
}));

const TopNavigationDropdownDrawerMenu: FunctionComponent<TopNavigationDropdownDrawerMenuProps> = ({
  translatedItems,
  tab
}) => {
  const { classes: { listItem, dividerContainer } } = useStyles();
  const { sendEvent } = useNavigationConfigs();
  const onItemClick = useCallback((t: TNavigationDropdownItem) => {
    sendEvent(clickDropdownMenuItemEventModel(tab.key, t.path));
    setTimeout(() => {
      window.open(getMenuItemHref(tab.href, t.path), '_self');
    }, 100);
  },
    [sendEvent, tab],
  );

  return (
    <List>
      {translatedItems.map((subMenu, index) => (
        <React.Fragment key={subMenu[0].path}>
          {subMenu.map((item) => (
            <ListItemButton key={item.path} onClick={() => onItemClick(item)} classes={{ root: listItem }}>
              <Link href={getMenuItemHref(tab.href, item.path)} color='inherit' underline='none'>
                <Typography color='primary' variant='largeLabel1'>
                  {item.title}
                </Typography>
              </Link>
            </ListItemButton>
          ))}
          {index !== translatedItems.length - 1 && <div className={dividerContainer}><Divider /></div>}
        </React.Fragment>
      ))}
    </List>
  );
};

export default TopNavigationDropdownDrawerMenu;
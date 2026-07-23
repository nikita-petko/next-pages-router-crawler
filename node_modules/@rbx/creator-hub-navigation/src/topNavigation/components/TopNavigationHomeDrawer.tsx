import type { FunctionComponent } from 'react';
import React, { useCallback, useState } from 'react';
import {
  Typography,
  List,
  makeStyles,
  ListItemIcon,
  listItemClasses,
  listItemIconClasses,
  typographyClasses,
  ListItemButton,
  Link,
} from '@rbx/ui';
import { clickListEventModel } from '../../event/eventConstants';
import NavigationTranslate from '../../hooks/NavigationTranslate';
import useNavigationConfigs from '../../hooks/useNavigationConfigs';
import useGetNavigationTabs from '../../utils/useGetNavigationTabs';
import type { NavigationTab } from '../constants/navigationConstants';
import { ENavigationTabType } from '../constants/navigationConstants';
import TopNavigationSidebarDrawerWithBackButton from './TopNavigationSidebarDrawerWithBackButton';
import TopNavigationSidebarDrawerWithHeader from './TopNavigationSidebarDrawerWithHeader';

type TopNavigationHomeDrawerProps = {
  open: boolean;
  onClickClose: () => void;
};
const useStyles = makeStyles()((theme) => ({
  listItem: {
    padding: theme.spacing(1.5, 1),
  },
  // TODO(yanzhuang, CRF-3945): switch to use rbx/ui styles when new ListItem released
  listItemNew: {
    borderRadius: 8,
    paddingTop: 12,
    paddingBottom: 12,
    [`& .${typographyClasses.root}, & .${listItemIconClasses.root}`]: {
      color: theme.palette.text.secondary,
    },
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      [`& .${typographyClasses.root}, & .${listItemIconClasses.root}`]: {
        color: theme.palette.text.primary,
      },
    },
    [`&.${listItemClasses.selected}, &.${listItemClasses.selected}:hover`]: {
      backgroundColor: theme.palette.action.selected,
      [`& .${typographyClasses.root}`]: {
        fontWeight: theme.typography.fontWeightMedium,
      },
      [`& .${typographyClasses.root}, & .${listItemIconClasses.root}`]: {
        color: theme.palette.text.primary,
      },
    },
  },
  listItemIcon: {
    minWidth: 40,
  },
}));

const TopNavigationHomeDrawer: FunctionComponent<TopNavigationHomeDrawerProps> = ({
  open,
  onClickClose,
}) => {
  const {
    environment,
    target,
    currentProduct,
    disableProducts,
    creatorEventsVariant,
    drawerVariant,
    navigationDropdownTabs,
    sendEvent,
  } = useNavigationConfigs();
  const navigationTabs = useGetNavigationTabs({
    target,
    environment,
    position: 'drawer',
    disableProducts,
    creatorEventsVariant,
    navigationDropdownTabs,
  });
  const {
    classes: { listItem, listItemNew, listItemIcon },
  } = useStyles();
  const [isSubDrawerOpen, setIsSubDrawerOpen] = useState(new Map<string, boolean>());

  const onTabClick = useCallback(
    (tab: NavigationTab) => {
      sendEvent(clickListEventModel(tab.key));
      if (tab.type === ENavigationTabType.Dropdown && tab.dropdownContentComponent) {
        setIsSubDrawerOpen((prev) => new Map(prev).set(tab.key, true));
      } else {
        setIsSubDrawerOpen(new Map<string, boolean>());
        setTimeout(() => {
          const tabHref = tab.tabPath ? `${tab.href}${tab.tabPath}` : tab.href;
          window.open(tabHref, '_self');
        }, 100);
      }
    },
    [sendEvent, setIsSubDrawerOpen],
  );

  const onCloseSubDrawer = useCallback((key: string) => {
    setIsSubDrawerOpen((prev) => new Map(prev).set(key, false));
  }, []);

  const onCloseMainDrawer = useCallback(() => {
    setIsSubDrawerOpen(new Map<string, boolean>());
    onClickClose();
  }, [onClickClose]);

  const useNewListStyle = drawerVariant === 'belowAppBar';
  return (
    <TopNavigationSidebarDrawerWithHeader
      open={open}
      onClickClose={onCloseMainDrawer}
      productKey='CreatorHub'>
      <List>
        {navigationTabs.map((tab) => {
          const { icon } = tab;
          let { activeIcon } = tab;
          activeIcon = activeIcon || icon;
          const tabHref = tab.tabPath ? `${tab.href}${tab.tabPath}` : tab.href;

          return (
            <React.Fragment key={tab.key}>
              <ListItemButton
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  onTabClick(tab);
                }}
                className={useNewListStyle ? listItemNew : listItem}
                selected={currentProduct === tab.key}>
                {useNewListStyle && icon != null && (
                  <ListItemIcon className={listItemIcon}>
                    {currentProduct === tab.key ? activeIcon : icon}
                  </ListItemIcon>
                )}
                <Link href={tabHref} color='inherit' target='_blank' underline='none' tabIndex={-1}>
                  <Typography color='primary' variant='largeLabel1'>
                    <NavigationTranslate content={tab.title} />
                  </Typography>
                </Link>
              </ListItemButton>
              {tab.type === ENavigationTabType.Dropdown && tab.dropdownContentComponent && (
                <TopNavigationSidebarDrawerWithBackButton
                  open={open && (isSubDrawerOpen.get(tab.key) || false)}
                  onClickBack={() => onCloseSubDrawer(tab.key)}
                  onClickClose={onCloseMainDrawer}
                  productKey='CreatorHub'
                  backButtonKey={tab.title}>
                  {React.createElement(tab.dropdownContentComponent, { tab })}
                </TopNavigationSidebarDrawerWithBackButton>
              )}
            </React.Fragment>
          );
        })}
      </List>
    </TopNavigationSidebarDrawerWithHeader>
  );
};

export default TopNavigationHomeDrawer;

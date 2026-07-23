import React, { FunctionComponent, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { Grid, Typography, Tab, Tabs, Link, makeStyles, IconButton, MenuIcon } from '@rbx/ui';
import {
  ENavigationTabType,
  NavigationTab,
  studioLogoDimension,
  topNavHeight,
  homeTab,
  homeTabStaging,
  homeTabDevelopment,
  drawerId,
  topNavigationZIndex,
} from '../constants/navigationConstants';
import useNavigationConfigs from '../../hooks/useNavigationConfigs';
import useGetNavigationTabs from '../../utils/useGetNavigationTabs';

import StudioIcon from './StudioIcon';
import TopNavigationDropdownTab from './TopNavigationDropdownTab';
import TopNavigationHomeDrawer from './TopNavigationHomeDrawer';
import TopNavigationProductSidebarDrawer from './TopNavigationProductSidebarDrawer';
import NavigationTranslate from '../../hooks/NavigationTranslate';
import getProductTitle from '../../utils/getProductTitle';
import {
  clickBackToCreatorEventModel,
  clickMenuIconEventModel,
  clickTabEventModel,
  loadNavEventModel,
  clickCreatorIconEventModel,
} from '../../event/eventConstants';
import getProductHref from '../../utils/getProductHref';
import { ProductKey } from '../../types';

interface TopNavigation {
  className?: string;
  rightContent?: ReactNode;
  bottomContent?: ReactNode;
  compactProductSidebarNavigation?: ReactNode;
}

const useTopNavigationStyles = makeStyles()((theme) => ({
  root: {
    width: '100%',
    height: topNavHeight,
    backgroundColor: theme.palette.navigation.global,
    padding: '0 48px 0 36px',
    [theme.breakpoints.down('XLarge')]: {
      padding: '0 32px 0 20px',
    },
    [theme.breakpoints.down('Medium')]: {
      padding: '0 24px 0 12px',
    },
  },

  headerButton: {
    color: theme.palette.text.primary,
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    '&:hover': {
      textDecoration: 'none',
    },
  },

  logo: {
    width: studioLogoDimension,
    height: studioLogoDimension,
    verticalAlign: 'middle',
  },

  tabClass: {
    textTransform: 'none',
    padding: '0 12px',
    [theme.breakpoints.up('XXLarge')]: {
      padding: '0 20px',
    },
    opacity: 1,
    minWidth: 0,
    '&:focus-visible': {
      outline: `${theme.palette.content.standard} auto`,
      outlineOffset: '-8px',
    },
  },

  header: {
    borderBottom: `1px solid ${theme.palette.outlineBorder}`,
    width: '100%',
    position: 'sticky',
    top: '0px',
    zIndex: topNavigationZIndex(theme),
  },

  heading: {
    whiteSpace: 'nowrap',
    padding: '0 20px 0 0',
    [theme.breakpoints.down('XLarge')]: {
      padding: '0 16px 0 6px',
    },
  },
}));

const TopNavigation: FunctionComponent<TopNavigation> = ({
  rightContent,
  bottomContent,
  compactProductSidebarNavigation,
  className,
}) => {
  const {
    classes: { root, tabClass, header, headerButton, heading },
    cx,
  } = useTopNavigationStyles();
  const {
    homeDrawerOpen,
    productNavigationDrawerOpen,
    environment,
    target,
    currentProduct,
    disableProducts,
    creatorEventsVariant,
    navigationDropdownTabs,
    isCompact,
    sendEvent,
    toggleHomeDrawerOpen,
    toggleProductNavigationDrawer,
  } = useNavigationConfigs();
  const homePath = useMemo(() => {
    if (environment === 'production') {
      return homeTab.href;
    }

    if (environment === 'staging') {
      return homeTabStaging.href;
    }

    return homeTabDevelopment.href;
  }, [environment]);

  const navigationTabs = useGetNavigationTabs({
    target,
    environment,
    position: 'topNav',
    disableProducts,
    creatorEventsVariant,
    navigationDropdownTabs,
  });

  const currentProductHeader = getProductTitle(currentProduct);
  const tabsValue =
    currentProduct === ProductKey.Home ? ProductKey.CreatorDashboard : currentProduct;

  useEffect(() => {
    sendEvent(loadNavEventModel);
  }, [sendEvent]);

  const onTabClick = useCallback(
    (tab: NavigationTab) => {
      sendEvent(clickTabEventModel(tab.key));
      setTimeout(() => {
        window.open(tab.href, '_self');
      }, 100);
    },
    [sendEvent],
  );

  const tabsContent = useMemo(
    () =>
      navigationTabs
        .filter((tab: NavigationTab) => isCompact === true || tab.key !== 'Home')
        .map((tab: NavigationTab) => {
          const labelContent = tab.title;

          const defaultTab = (
            <Tab
              className={tabClass}
              component='a'
              href={tab.href}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                onTabClick(tab);
              }}
              key={tab.key}
              value={tab.key}
              tabIndex={0}
              label={<NavigationTranslate content={labelContent} />}
            />
          );
          if (tab.type === ENavigationTabType.Dropdown) {
            return (
              <TopNavigationDropdownTab focused={tab.key === tabsValue} key={tab.key} tab={tab} />
            );
          }
          return defaultTab;
        }),
    [isCompact, navigationTabs, onTabClick, tabClass, tabsValue],
  );

  if (isCompact) {
    return (
      <header className={header}>
        <Grid
          className={cx(root, className)}
          component='nav'
          container
          direction='row'
          alignItems='center'
          justifyContent='space-between'
          wrap='nowrap'>
          <Grid item XSmall='auto'>
            <Grid container alignItems='center' wrap='nowrap'>
              <IconButton
                color='secondary'
                onClick={() => {
                  if (compactProductSidebarNavigation != null) {
                    toggleProductNavigationDrawer(!productNavigationDrawerOpen);
                  } else {
                    toggleHomeDrawerOpen(!homeDrawerOpen);
                  }
                  sendEvent(clickMenuIconEventModel);
                }}
                aria-label='menu'
                size='large'>
                <MenuIcon />
              </IconButton>
              <Link
                classes={{ root: headerButton }}
                href={getProductHref(
                  currentProduct,
                  typeof window !== 'undefined' ? window.location.origin : undefined,
                )}>
                <Typography variant='h5' className={heading}>
                  <NavigationTranslate content={currentProductHeader} />
                </Typography>
              </Link>
            </Grid>
          </Grid>
          <Grid container justifyContent='flex-end' wrap='nowrap'>
            {rightContent}
          </Grid>
        </Grid>
        {bottomContent}
        <Grid id={drawerId}>
          {compactProductSidebarNavigation ? (
            <TopNavigationProductSidebarDrawer
              open={productNavigationDrawerOpen}
              onClickClose={() => {
                toggleProductNavigationDrawer(false);
              }}
              onClickBack={() => {
                toggleHomeDrawerOpen(true);
                sendEvent(clickBackToCreatorEventModel);
              }}>
              {compactProductSidebarNavigation}
            </TopNavigationProductSidebarDrawer>
          ) : null}
          <TopNavigationHomeDrawer
            open={homeDrawerOpen}
            onClickClose={() => {
              toggleHomeDrawerOpen(false);
            }}
          />
        </Grid>
      </header>
    );
  }

  // We don't want to select a tab when it is a dropdown
  const isCurrentProductDropdown =
    navigationTabs?.find(
      (tab) => tab.key === tabsValue && tab.type === ENavigationTabType.Dropdown,
    ) !== undefined;

  return (
    <header className={header}>
      <Grid
        className={cx(root, className)}
        component='nav'
        container
        direction='row'
        alignItems='center'
        justifyContent='space-between'
        wrap='nowrap'>
        <Grid item>
          <Grid container alignItems='center' wrap='nowrap'>
            <Link
              onClick={() => {
                sendEvent(clickCreatorIconEventModel);
              }}
              classes={{ root: headerButton }}
              href={homePath}>
              <StudioIcon />
              <Typography variant='h4' className={heading}>
                <NavigationTranslate content='Heading.Creator' />
              </Typography>
            </Link>
            <Grid item XSmall='auto'>
              <Tabs
                value={isCurrentProductDropdown ? false : tabsValue}
                TabIndicatorProps={{ hidden: true }}>
                {tabsContent}
              </Tabs>
            </Grid>
          </Grid>
        </Grid>
        <Grid XSmall='auto' item>
          {rightContent}
        </Grid>
      </Grid>
      {bottomContent}
    </header>
  );
};

export default TopNavigation;

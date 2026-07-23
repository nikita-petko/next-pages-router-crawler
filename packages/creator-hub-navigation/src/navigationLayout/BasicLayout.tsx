import React, { PropsWithChildren, forwardRef, useCallback, useMemo, useState } from 'react';
import {
  BookIcon,
  BookOutlinedIcon,
  DashboardIcon,
  DashboardOutlinedIcon,
  ForumIcon,
  ForumOutlinedIcon,
  GolfCourseIcon,
  Grid,
  HomeIcon,
  HomeOutlinedIcon,
  LanguageIcon,
  makeStyles,
  ShoppingCartIcon,
  ShoppingCartOutlinedIcon,
  useMediaQuery,
  WorkIcon,
  WorkOutlineIcon,
} from '@rbx/ui';
import PublicFooter from '../footer/PublicFooter';
import PrivateFooter from '../footer/PrivateFooter';
import TopNavigation from '../topNavigationV2';
import { documentationTab, exploreTab } from '../topNavigation/constants/navigationConstants';
import { TBuildTarget, TProductKey, TRobloxEnvironment } from '../types';
import {
  getCreatorHubBasePathV2 as getCreatorHubBasePath,
  getDevForumBasePath,
} from '../utils/getBasePaths';
import NavigationDrawer from '../navigationDrawer/NavigationDrawer';
import CreatorHubDrawerContent from '../navigationDrawer/CreatorHubDrawerContent';
import { TNavigationTab } from '../topNavigationV2/constants';
import isDashboard from '../utils/isDashboard';

const useBasicLayoutStyles = makeStyles()({
  root: {
    height: '100vh',
    width: '100%',
  },

  layout: {
    width: '100%',
    height: '100%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },

  scrollable: {
    width: '100%',
    display: 'flex',
    flexWrap: 'nowrap',
    flexDirection: 'column',
    alignItems: 'center',
    overflowY: 'auto',
    overflowX: 'hidden',
    scrollbarColor: 'grey transparent',
    scrollbarWidth: 'thin',
    '&::-webkit-scrollbar': {
      width: 6,
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'grey',
      borderRadius: '10rem',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
  },
});

type TBasicLayout = {
  target: TBuildTarget;
  product: TProductKey;
  environment: TRobloxEnvironment;
};

export const BasicLayout = forwardRef<HTMLDivElement, PropsWithChildren<TBasicLayout>>(
  ({ children, target, environment, product }, ref) => {
    const {
      classes: { root, layout, scrollable },
    } = useBasicLayoutStyles();

    const [drawerOpen, setDrawerOpen] = useState(false);
    const openDrawer = useCallback(() => {
      setDrawerOpen(true);
    }, []);
    const closeDrawer = useCallback(() => {
      setDrawerOpen(false);
    }, []);

    const baseUrl = getCreatorHubBasePath(target, environment);
    const creatorHubUrl = isDashboard(product) ? '/' : baseUrl;
    const isCompact = useMediaQuery((theme) => theme.breakpoints.down('Large'));

    const tabs = useMemo(() => {
      return [
        isCompact
          ? {
              key: 'Home',
              title: 'Heading.Home',
              current: product === 'Home',
              href: `${creatorHubUrl}`,
              icon: <HomeOutlinedIcon />,
              activeIcon: <HomeIcon />,
            }
          : null,
        {
          key: 'CreatorDashboard',
          title: 'Heading.Dashboard',
          current: product === 'CreatorDashboard',
          href: `${creatorHubUrl}dashboard/creations`,
          icon: <DashboardOutlinedIcon />,
          activeIcon: <DashboardIcon />,
        },
        {
          key: 'Documentation',
          title: 'Heading.Learn',
          current: product === 'Documentation',
          dropdown: documentationTab,
          icon: <BookOutlinedIcon />,
          activeIcon: <BookIcon />,
        },
        {
          key: 'Explore',
          title: 'Heading.Explore',
          current:
            product === 'RoadMap' ||
            product === 'Talent' ||
            product === 'Explore' ||
            product === 'Licenses',
          dropdown: exploreTab,
          icon: <LanguageIcon />,
          activeIcon: <LanguageIcon />,
        },
        {
          key: 'Store',
          title: 'Heading.Store',
          current: product === 'Store',
          href: `${product === 'Store' ? '/' : baseUrl}store`,
          icon: <ShoppingCartOutlinedIcon />,
          activeIcon: <ShoppingCartIcon />,
        },
        {
          key: 'Talent',
          title: 'Heading.Talent',
          current: product === 'Talent',
          href: `${product === 'Talent' ? '/' : baseUrl}talent`,
          icon: <WorkOutlineIcon />,
          activeIcon: <WorkIcon />,
        },
        {
          key: 'Forum',
          title: 'Heading.Forums',
          current: product === 'Forum',
          href: getDevForumBasePath(environment),
          icon: <ForumOutlinedIcon />,
          activeIcon: <ForumIcon />,
        },
        {
          key: 'RoadMap',
          title: 'Heading.Roadmap',
          current: product === 'RoadMap',
          href: `${creatorHubUrl}roadmap`,
          icon: <GolfCourseIcon />,
        },
      ].filter((t) => t) as TNavigationTab[];
    }, [baseUrl, creatorHubUrl, environment, isCompact, product]);

    return (
      <Grid classes={{ root }} ref={ref}>
        <Grid classes={{ root: layout }}>
          <NavigationDrawer open={drawerOpen} onClose={closeDrawer}>
            <CreatorHubDrawerContent tabs={tabs} onClickClose={closeDrawer} />
          </NavigationDrawer>
          <TopNavigation
            tabs={tabs}
            creatorHubUrl={creatorHubUrl}
            isCompact={isCompact}
            openDrawer={openDrawer}
          />
          <Grid classes={{ root: scrollable }}>
            {children}
            <footer>
              <PublicFooter />
              <PrivateFooter />
            </footer>
          </Grid>
        </Grid>
      </Grid>
    );
  },
);

BasicLayout.displayName = 'BasicLayout';
export default BasicLayout;

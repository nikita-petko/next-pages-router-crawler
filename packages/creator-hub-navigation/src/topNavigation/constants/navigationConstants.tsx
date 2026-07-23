import React, { ReactNode } from 'react';
import {
  TTheme,
  HomeIcon,
  HomeOutlinedIcon,
  BookOutlinedIcon,
  BookIcon,
  ForumOutlinedIcon,
  ForumIcon,
  DashboardOutlinedIcon,
  DashboardIcon,
  LanguageIcon,
  PeopleIcon,
  PeopleOutlineOutlinedIcon,
  ShoppingCartOutlinedIcon,
  ShoppingCartIcon,
  EventIcon,
} from '@rbx/ui';
import { TProductKey } from '../../types';
import {
  globalCreatorHubBasePath,
  globalCreatorHubBasePathStaging,
  globalCreatorHubBasePathDevelopment,
  luobuCreatorHubBasePath,
  luobuCreatorHubBasePathStaging,
  luobuCreatorHubBasePathDevelopment,
} from '../../utils/getBasePaths';
import TopNavigationDropdownSubTabsContent from '../components/TopNavigationDropdownSubTabsContent';
import TopNavigationDropdownTabContentExplore from '../components/TopNavigationDropdownTabContentExplore';

export enum ENavigationTabType {
  Dropdown = 'Dropdown',
  Basic = 'Basic',
}

export enum ENavigationTabContentType {
  DropdownMenu = 'DropdownMenu',
}

export const defaultNavigationTabType = ENavigationTabType.Basic;

export interface NavigationTab {
  icon?: ReactNode;
  activeIcon?: ReactNode;
  key: TProductKey;
  title: string;
  href: string;
  type?: ENavigationTabType;
  dropdownContentComponent?: React.FunctionComponent<{ tab: NavigationTab }>;
  subTabs?: NavigationTab[];
  path?: string;
  // tabPath is used to provide a different path for the tab compared to its child items
  tabPath?: string;
}

export const creatorHubTab: NavigationTab = {
  key: 'CreatorHub',
  title: 'Heading.Creator',
  href: `${globalCreatorHubBasePath}`,
  path: '',
};

export const creatorHubTabStaging: NavigationTab = {
  key: 'CreatorHub',
  title: 'Heading.Creator',
  href: `${globalCreatorHubBasePathStaging}`,
  path: '',
};

export const creatorHubTabDevelopment: NavigationTab = {
  key: 'CreatorHub',
  title: 'Heading.Creator',
  href: `${globalCreatorHubBasePathDevelopment}`,
  path: '',
};

export const homeTab: NavigationTab = {
  icon: <HomeOutlinedIcon />,
  activeIcon: <HomeIcon />,
  key: 'Home',
  title: 'Heading.Home',
  href: `${globalCreatorHubBasePath}`,
  path: '/',
};

export const homeTabStaging: NavigationTab = {
  icon: <HomeOutlinedIcon />,
  activeIcon: <HomeIcon />,
  key: 'Home',
  title: 'Heading.Home',
  href: `${globalCreatorHubBasePathStaging}`,
  path: '/',
};

export const homeTabDevelopment: NavigationTab = {
  icon: <HomeOutlinedIcon />,
  activeIcon: <HomeIcon />,
  key: 'Home',
  title: 'Heading.Home',
  href: `${globalCreatorHubBasePathDevelopment}`,
  path: '/',
};

export const documentationTab: NavigationTab = {
  icon: <BookOutlinedIcon />,
  activeIcon: <BookIcon />,
  key: 'Documentation',
  title: 'Heading.Learn',
  href: `${globalCreatorHubBasePath}/docs`,
  path: '/docs',
};

export const assistantTab: NavigationTab = {
  key: 'Assistant',
  title: 'Heading.Assistant',
  href: `${globalCreatorHubBasePath}/docs/assistant`,
  path: '/docs/assistant',
};

export const documentationTabStaging: NavigationTab = {
  icon: <BookOutlinedIcon />,
  activeIcon: <BookIcon />,
  key: 'Documentation',
  title: 'Heading.Learn',
  href: `${globalCreatorHubBasePathStaging}/docs`,
  path: '/docs',
};

export const documentationTabDevelopment: NavigationTab = {
  icon: <BookOutlinedIcon />,
  activeIcon: <BookIcon />,
  key: 'Documentation',
  title: 'Heading.Learn',
  href: `${globalCreatorHubBasePathDevelopment}/docs`,
  path: '/docs',
};

export const exploreTab: NavigationTab = {
  icon: <LanguageIcon />,
  activeIcon: <LanguageIcon />,
  key: 'Explore',
  title: 'Heading.Explore',
  href: `${globalCreatorHubBasePath}`,
  dropdownContentComponent: TopNavigationDropdownTabContentExplore,
  path: '/',
  tabPath: '/explore/licenses',
};

export const exploreTabStaging: NavigationTab = {
  icon: <LanguageIcon />,
  activeIcon: <LanguageIcon />,
  key: 'Explore',
  title: 'Heading.Explore',
  href: `${globalCreatorHubBasePathStaging}`,
  dropdownContentComponent: TopNavigationDropdownTabContentExplore,
  path: '/',
  tabPath: '/explore/licenses',
};

export const exploreTabDevelopment: NavigationTab = {
  icon: <LanguageIcon />,
  activeIcon: <LanguageIcon />,
  key: 'Explore',
  title: 'Heading.Explore',
  href: `${globalCreatorHubBasePathDevelopment}`,
  dropdownContentComponent: TopNavigationDropdownTabContentExplore,
  path: '/',
  tabPath: '/explore/licenses',
};

export const forumTab: NavigationTab = {
  icon: <ForumOutlinedIcon />,
  activeIcon: <ForumIcon />,
  key: 'Forum',
  title: 'Heading.Forums',
  href: 'https://devforum.roblox.com/',
};

export const luobuForumTab: NavigationTab = {
  icon: <ForumOutlinedIcon />,
  activeIcon: <ForumIcon />,
  key: 'Forum',
  title: 'Heading.Forums',
  href: 'https://forum.robloxdev.cn/',
};

export const forumTabStaging: NavigationTab = {
  icon: <ForumOutlinedIcon />,
  activeIcon: <ForumIcon />,
  key: 'Forum',
  title: 'Heading.Forums',
  href: 'https://devforum.sitetest1.robloxlabs.com',
};

export const forumTabDevelopment: NavigationTab = {
  icon: <ForumOutlinedIcon />,
  activeIcon: <ForumIcon />,
  key: 'Forum',
  title: 'Heading.Forums',
  href: 'https://devforum.sitetest3.robloxlabs.com',
};

export const creatorEventsTab: NavigationTab = {
  icon: <EventIcon />,
  activeIcon: <EventIcon />,
  key: 'CreatorEvents',
  title: 'Heading.CreatorEvents',
  href: `https://events.roblox.com`,
};

export const communityTab: NavigationTab = {
  key: 'Community',
  title: 'Label.Community',
  href: `https://devforum.roblox.com`,
  type: ENavigationTabType.Dropdown,
  dropdownContentComponent: TopNavigationDropdownSubTabsContent,
  subTabs: [forumTab, creatorEventsTab],
};

export const advertiseTab: NavigationTab = {
  key: 'Advertise',
  title: 'Heading.AdsManager',
  href: `${globalCreatorHubBasePath}`,
  path: '/advertise',
};

export const talentTab: NavigationTab = {
  key: 'Talent',
  title: 'Heading.Talent',
  href: `${globalCreatorHubBasePath}`,
  path: '/talent',
};

export const musicTab: NavigationTab = {
  key: 'Music',
  title: 'Label.MusicCharts',
  href: `https://music.roblox.com/`,
};

export const topNavigationTabs: NavigationTab[] = [
  homeTab,
  {
    icon: <DashboardOutlinedIcon />,
    activeIcon: <DashboardIcon />,
    key: 'CreatorDashboard',
    title: 'Heading.Dashboard',
    href: `${globalCreatorHubBasePath}/dashboard/creations`,
    path: '/dashboard/creations',
  },
  documentationTab,
  exploreTab,
  {
    icon: <ShoppingCartOutlinedIcon />,
    activeIcon: <ShoppingCartIcon />,
    key: 'Store',
    title: 'Heading.Store',
    href: `${globalCreatorHubBasePath}/store`,
    path: '/store',
  },
  {
    icon: <PeopleOutlineOutlinedIcon />,
    activeIcon: <PeopleIcon />,
    key: 'CommunityEvents',
    title: 'Heading.CommunityEvents',
    href: `${globalCreatorHubBasePath}/events`,
    path: '/events',
  },
  forumTab,
];

export const topNavigationTabsStaging: NavigationTab[] = [
  homeTabStaging,
  {
    icon: <DashboardOutlinedIcon />,
    activeIcon: <DashboardIcon />,
    key: 'CreatorDashboard',
    title: 'Heading.Dashboard',
    href: `${globalCreatorHubBasePathStaging}/dashboard/creations`,
    path: '/dashboard/creations',
  },
  documentationTabStaging,
  exploreTabStaging,
  {
    icon: <ShoppingCartOutlinedIcon />,
    activeIcon: <ShoppingCartIcon />,
    key: 'Store',
    title: 'Heading.Store',
    href: `${globalCreatorHubBasePathStaging}/store`,
    path: '/store',
  },
  {
    icon: <PeopleOutlineOutlinedIcon />,
    activeIcon: <PeopleIcon />,
    key: 'CommunityEvents',
    title: 'Heading.CommunityEvents',
    href: `${globalCreatorHubBasePathStaging}/events`,
    path: '/events',
  },
  forumTabStaging,
];

export const topNavigationTabsDevelopment: NavigationTab[] = [
  homeTabDevelopment,
  {
    icon: <DashboardOutlinedIcon />,
    activeIcon: <DashboardIcon />,
    key: 'CreatorDashboard',
    title: 'Heading.Dashboard',
    href: `${globalCreatorHubBasePathDevelopment}/dashboard/creations`,
    path: '/dashboard/creations',
  },
  documentationTabDevelopment,
  exploreTabDevelopment,
  {
    icon: <ShoppingCartOutlinedIcon />,
    activeIcon: <ShoppingCartIcon />,
    key: 'Store',
    title: 'Heading.Store',
    href: `${globalCreatorHubBasePathDevelopment}/store`,
    path: '/store',
  },
  {
    icon: <PeopleOutlineOutlinedIcon />,
    activeIcon: <PeopleIcon />,
    key: 'CommunityEvents',
    title: 'Heading.CommunityEvents',
    href: `${globalCreatorHubBasePathDevelopment}/events`,
    path: '/events',
  },
  forumTabDevelopment,
];

export const luobuTopNavigationTabsStaging: NavigationTab[] = [
  {
    icon: <DashboardOutlinedIcon />,
    activeIcon: <DashboardIcon />,
    key: 'CreatorDashboard',
    title: 'Heading.Dashboard',
    href: `${luobuCreatorHubBasePathStaging}/creations`,
  },
  luobuForumTab,
];
export const luobuTopNavigationTabsDevelopment: NavigationTab[] = [
  {
    icon: <DashboardOutlinedIcon />,
    activeIcon: <DashboardIcon />,
    key: 'CreatorDashboard',
    title: 'Heading.Dashboard',
    href: `${luobuCreatorHubBasePathDevelopment}/creations`,
  },
  luobuForumTab,
];
export const luobuTopNavigationTabs: NavigationTab[] = [
  {
    icon: <DashboardOutlinedIcon />,
    activeIcon: <DashboardIcon />,
    key: 'CreatorDashboard',
    title: 'Heading.Dashboard',
    href: `${luobuCreatorHubBasePath}/creations`,
  },
  luobuForumTab,
];

export const productTitleMapping: Map<TProductKey, string> = [
  creatorHubTab,
  ...topNavigationTabs,
  assistantTab,
].reduce((map, tab) => {
  map.set(tab.key, tab.title);
  return map;
}, new Map());

export const productHrefMapping: Map<TProductKey, NavigationTab> = [
  creatorHubTab,
  advertiseTab,
  talentTab,
  musicTab,
  ...topNavigationTabs,
].reduce((map, tab) => {
  map.set(tab.key, tab);
  return map;
}, new Map());

export const studioLogoDimension = 36;

export const studioLogoDimensionCompact = 20;

export const topNavHeight = 60;

export const sidebarDrawerWidth = 340;

export const drawerId = 'top-navigation-drawer';

export const topNavigationZIndex = (theme: TTheme) => theme.zIndex.drawer + 1;

export const notificationTrayZIndex = (theme: TTheme) => theme.zIndex.drawer + 2;

export const notificationOverflowMenuZIndex = (theme: TTheme) => theme.zIndex.drawer + 3;

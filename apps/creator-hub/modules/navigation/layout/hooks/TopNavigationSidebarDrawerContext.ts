import { createContext } from 'react';

export type TopNavigationSidebarDrawerContextValue = {
  insideTopNavigationDrawer: boolean;
};
const defaultContextValue: TopNavigationSidebarDrawerContextValue = {
  insideTopNavigationDrawer: false,
};

const TopNavigationSidebarDrawerContext =
  createContext<TopNavigationSidebarDrawerContextValue>(defaultContextValue);
TopNavigationSidebarDrawerContext.displayName = 'TopNavigationSidebarDrawerContext';

export default TopNavigationSidebarDrawerContext;

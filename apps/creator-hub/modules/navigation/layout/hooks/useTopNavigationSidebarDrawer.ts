import { useContext } from 'react';
import TopNavigationSidebarDrawerContext from './TopNavigationSidebarDrawerContext';

export default function useTopNavigationSidebarDrawer() {
  return useContext(TopNavigationSidebarDrawerContext);
}

import { useMemo } from 'react';
import type { NavigationTab } from '../topNavigation/constants/navigationConstants';
import {
  communityTab,
  creatorEventsTab,
  defaultNavigationTabType,
  ENavigationTabType,
  luobuTopNavigationTabs,
  luobuTopNavigationTabsStaging,
  luobuTopNavigationTabsDevelopment,
  topNavigationTabs,
  topNavigationTabsStaging,
  topNavigationTabsDevelopment,
} from '../topNavigation/constants/navigationConstants';
import type { TBuildTarget, TTargetEnvironment, TProductKey } from '../types';
import { useTabsWithComputedHref } from './useTabsWithComputedHref';

function filterDisabledProducts(tabs: NavigationTab[], disableProducts: string[] | null) {
  return disableProducts ? tabs.filter((tab) => !disableProducts.includes(tab.key)) : tabs;
}

type GetNavigationTabsOptions = {
  target: TBuildTarget;
  environment: TTargetEnvironment;
  position: 'drawer' | 'topNav';
  disableProducts: string[] | null;
  creatorEventsVariant: string | null;
};

function useGetNavigationTabs(options: GetNavigationTabsOptions): NavigationTab[] {
  const { target, environment, disableProducts, creatorEventsVariant, position } = options;

  const filteredTabs = useMemo(() => {
    let tabs: NavigationTab[];
    if (target === 'luobu') {
      if (environment === 'production') {
        tabs = luobuTopNavigationTabs;
      } else if (environment === 'staging') {
        tabs = luobuTopNavigationTabsStaging;
      } else {
        tabs = luobuTopNavigationTabsDevelopment;
      }
    } else if (environment === 'production') {
      tabs = topNavigationTabs;
    } else if (environment === 'staging') {
      tabs = topNavigationTabsStaging;
    } else {
      tabs = topNavigationTabsDevelopment;
    }

    return filterDisabledProducts(tabs, disableProducts);
  }, [disableProducts, environment, target]);

  let tabsUrl = typeof window !== 'undefined' ? window?.location.origin : undefined;
  if (
    typeof window !== 'undefined' &&
    (window?.location.host.startsWith('devforum') || window?.location.host.startsWith('music'))
  ) {
    tabsUrl = tabsUrl?.replace(/(devforum|music)/, 'create');
  }
  let tabs = useTabsWithComputedHref(filteredTabs, tabsUrl);

  if (target === 'luobu') {
    return filteredTabs;
  }
  const forumIndex = tabs.findIndex((tab) => tab.key === 'Forum');
  if (creatorEventsVariant === 'dropdown') {
    if (position === 'topNav') {
      tabs = tabs.map((tab) => {
        if (tab.key === 'Forum') {
          return communityTab;
        }
        return tab;
      });
    } else {
      tabs.splice(forumIndex + 1, 0, creatorEventsTab);
    }
  } else if (creatorEventsVariant === 'tab') {
    tabs.splice(forumIndex + 1, 0, creatorEventsTab);
  }

  return tabs;
}

const useGetNavigationTabsWithType = (
  options: GetNavigationTabsOptions & { navigationDropdownTabs: TProductKey[] | null },
): NavigationTab[] => {
  const { navigationDropdownTabs, ...otherOptions } = options;
  const tabs = useGetNavigationTabs(otherOptions);
  return tabs.map((tab) => ({
    ...tab,
    type: navigationDropdownTabs?.includes(tab.key)
      ? ENavigationTabType.Dropdown
      : defaultNavigationTabType,
  }));
};

export default useGetNavigationTabsWithType;

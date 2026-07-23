import type { NavigationTab } from '../topNavigation/constants/navigationConstants';

// NOTE (@mbae, 03/26/25): Use this only if you have a NavigationTab
// Otherwise, you can just use `${getCreatorHubBasePath(target, environment)}${yourPath}`
export const getTabWithComputedHref = (tab: NavigationTab, originUrl?: string) => {
  const newTab = { ...tab };
  if (originUrl && newTab.path && newTab.tabPath) {
    newTab.href = originUrl;
  } else if (originUrl && newTab.path) {
    newTab.href = `${originUrl}${newTab.path}`;
  } else if (originUrl && (newTab.key === 'Forum' || newTab.key === 'Music')) {
    // NOTE(@leoliu, 01-26-2026): DevForum and Music are on different subdomains. If we detect the originUrl as sitetest, we need to change the prod href that getProductHref uses to match.
    // e.g. https://music.roblox.com -> https://music.sitetest1.robloxlabs.com if originUrl is sitetest1
    const sitetestEnvironment = originUrl.match(/sitetest(\d)/);
    if (sitetestEnvironment) {
      newTab.href = newTab.href
        .replace(/roblox.com/, `sitetest${sitetestEnvironment[1]}.robloxlabs.com`)
        .replace(/sitetest\d/, `sitetest${sitetestEnvironment[1]}`);
    }
  }

  return newTab;
};

/**
 * We replace the `href` property of a tab with the correct `href`
 * based on the origin and path of the tab. If a path or origin
 * isn't specified, then we stick with the current `href` value
 *
 * @param environment Environment of the Creator Hub app
 * @param rawTabs Tabs to convert
 * @param originUrl Origin URI to use
 * @returns A new copy of the tabs with a potentially new value for href
 */
export const useTabsWithComputedHref = (rawTabs: NavigationTab[], originUrl?: string) => {
  // NOTE (mbae 09/19/23): For some reason we can't memoize this (from PR https://github.rbx.com/Roblox/unified-creator-site/pull/144)
  const tabsWithPath: NavigationTab[] = rawTabs.map((tab) => {
    return getTabWithComputedHref(tab, originUrl);
  });

  return tabsWithPath;
};

import { ManagementTableTab } from '@type/navigation';

const COMMON_ASSET_BASE_PATH = `${process.env.assetPathPrefix}/common`;

/**
 * The Roblox glyph is a solid single-colour mark loaded through `<img>`, so it
 * can't inherit `currentColor`; each theme mode gets its own asset instead.
 */
export const robloxIconPathByThemeMode = {
  dark: `${COMMON_ASSET_BASE_PATH}/roblox_icon_white.svg`,
  light: `${COMMON_ASSET_BASE_PATH}/roblox_icon_black.svg`,
} as const;

export const defaultPageTitle = 'Ads Manager';
export const defaultPageTitleKey = 'Label.AdsManager';

const campaignTab: ManagementTableTab = {
  key: 'campaigns',
  path: '?tableView=campaigns',
  titleKey: 'Campaigns',
};

const adsetsTab: ManagementTableTab = {
  key: 'adsets',
  path: '?tableView=adsets',
  titleKey: 'Ad Sets',
};

const adsTab: ManagementTableTab = {
  key: 'ads',
  path: '?tableView=ads',
  titleKey: 'Ads',
};

export const adManagerTabs: ManagementTableTab[] = [campaignTab, adsetsTab, adsTab];

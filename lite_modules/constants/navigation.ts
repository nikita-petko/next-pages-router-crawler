import { ManagementTableTab } from '@type/navigation';

const COMMON_ASSET_BASE_PATH = `${process.env.assetPathPrefix}/common`;

export const robloxIconPath = `${COMMON_ASSET_BASE_PATH}/roblox_icon_white.svg`;

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

import Creator from '../common/enums/Creator';

const basePath = `https://www.${process.env.robloxSiteDomain}`;
const baseAdsManagerPath = `https://advertise.${process.env.robloxSiteDomain}`;
export const getUrl = () => basePath;
export const getHomeUrl = () => `${basePath}/home`;
export const getGameDetailsUrl = (rootPlaceId: number) => `${basePath}/games/${rootPlaceId}`;
export const getCatalogUrl = (catalogId: number) => `${basePath}/catalog/${catalogId}`;
export const getBundleUrl = (bundleId: number) => `${basePath}/bundles/${bundleId}`;
export const getLookUrl = (lookId: number) => `${basePath}/looks/${lookId}`;
export const getBadgeUrl = (badgeId: number) => `${basePath}/badges/${badgeId}`;
export const getGamePassUrl = (gamePassId: number) => `${basePath}/game-pass/${gamePassId}`;
export const getGroupUrl = (groupId: number) => `${basePath}/groups/${groupId}`;
export const getUserUrl = (userId: number) => `${basePath}/users/${userId}/profile`;
export const getCreatorUrl = (creatorType: Creator, creatorId: number) => {
  if (creatorType === Creator.Group) {
    return getGroupUrl(creatorId);
  }
  return getUserUrl(creatorId);
};
export const getFriendsUrl = (userId: number) => `${basePath}/users/${userId}/friends#!/friends`;
export const AdsManagerUrl = baseAdsManagerPath;
export const getAdvertiseAssetUrl = (assetId: number) =>
  `${baseAdsManagerPath}?targetId=${assetId}&targetType=Asset`;
export const getAdvertisePassUrl = (assetId: number) =>
  `${baseAdsManagerPath}?targetId=${assetId}&targetType=GamePass`;
export const getSponsorExperienceUrl = (universeId: number) =>
  `${baseAdsManagerPath}?universeId=${universeId}`;
export const getSponsorExperienceCreateUrl = (universeId: number) =>
  `${baseAdsManagerPath}/create?universeId=${universeId}`;
export const getSponsorAvatarItemsUrl = () => `${basePath}/sponsorships/list#!/avatar-items`;
export const getAccountSettingsUrl = () => `${basePath}/my/account#!/info`;
export const getAccountSecurityUrl = () => `${basePath}/my/account#!/security`;
export const getTermsUrl = () => `${basePath}/info/terms`;
export const getTransactionsUrl = () => `${basePath}/transactions`;
export const getConfigureGroupRevenueSalesUrl = (groupId: number) =>
  `${basePath}/groups/configure?id=${groupId}#!/revenue/sales`;
export const getAppealsPortalUrl = () => `${basePath}/report-appeals#`;
export const getLegacyTransactionsUrl = () => `${basePath}/transactions`;
export const getLegacyGroupTransactionsUrl = (groupId: number) =>
  `${basePath}/groups/configure?id=${groupId}#!/revenue/sales`;
export const getEventUrl = (eventId: string) => `${basePath}/events/${eventId}`;
export const getSupportFormUrl = () => `${basePath}/support`;

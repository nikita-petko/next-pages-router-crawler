import { GetSitetestBaseUrl } from '@utils/url';

export const AdsManagerDocsUrl = 'https://create.roblox.com/docs/production/promotion/ads-manager';

export const getGroupRolesUrl = (): string =>
  `https://create.${GetSitetestBaseUrl()}/dashboard/group/roles`;

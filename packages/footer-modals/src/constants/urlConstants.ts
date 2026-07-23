export interface UrlConfig {
  withCredentials?: boolean;
  retryable?: boolean;
  url: string;
}

export const getUserSettingsApiUrl = (baseUrl: string): string => `${baseUrl}/v1/user-settings`;

export const getSetGpcApiUrl = (baseUrl: string): string => `${baseUrl}/v1/user-settings/gpc`;

export const getAccessManagementApiUrl = (baseUrl: string): string =>
  `${baseUrl}/access-management/v1/upsell-feature-access`;

export const getAdsPreferencesUrl = (locale: string): string =>
  `/my/account#!/privacy/AdPreferences?locale=${locale}`;

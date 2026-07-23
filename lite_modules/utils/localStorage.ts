import { LocalStorage } from 'ttl-localstorage';

import { InBrowser } from '@utils/browser';

export enum StorageKeys {
  AD_ACCOUNT_ID = 'adAccountId',
  HAS_CLOSED_AD_CREDIT_BANNER = 'hasClosedAdCreditBanner',
  HAS_CLOSED_MODERATED_CAMPAIGN_BANNER = 'hasClosedModeratedCampaignBanner',
  HAS_CLOSED_PLACE_JOIN_RESTRICTED_BANNER = 'hasClosedPlaceJoinRestrictedBanner',
  ORGANIZATION_ID = 'organizationId',
}

type KeyTypes = StorageKeys | string;

// Unfortunately, ttl-localstorage doesn't have a type for the value, so we have to define it ourselves
// Add general types for the value here if needed
// eslint-disable-next-line import/no-unused-modules
export type ValueTypes = string | number | boolean | null;

export const SetLocalStorage = (key: KeyTypes, value: ValueTypes, timeout?: number) =>
  InBrowser() && LocalStorage.put(key, value, timeout);

export const GetLocalStorage = (key: KeyTypes, defaultValue?: ValueTypes) =>
  InBrowser() && LocalStorage.get(key, defaultValue);

export const RemoveLocalStorage = (key: KeyTypes) => InBrowser() && LocalStorage.removeKey(key);

// eslint-disable-next-line import/no-unused-modules
export const ClearLocalStorage = () => InBrowser() && LocalStorage.clear();

// eslint-disable-next-line import/no-unused-modules
export const GetLocalStorageKeys = () => InBrowser() && LocalStorage.keys();

// eslint-disable-next-line import/no-unused-modules
export const GetKeyExisted = (key: KeyTypes) => InBrowser() && LocalStorage.keyExists(key);

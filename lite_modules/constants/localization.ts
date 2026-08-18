import { createContext } from 'react';

import { LocaleProviderContextType } from '@type/localization';

export const LocaleProviderContext = createContext<LocaleProviderContextType | null>(null);

export enum TranslationNamespace {
  // Owned by the serving side. ads-root resolves the served 1x2 CTA button label
  // out of this namespace, so the campaign-builder preview reads it too rather
  // than keeping its own copy of the same words.
  AdsServing = 'Ads.Serving',
  Account = 'AdvertiseCreationAndManagement.Account',
  Billing = 'AdvertiseCreationAndManagement.Billing',
  Campaign = 'AdvertiseCreationAndManagement.Campaign',
  CreativeLibrary = 'AdvertiseCreationAndManagement.CreativeLibrary',
  Error = 'AdvertiseCreationAndManagement.Error',
  Forecast = 'AdvertiseCreationAndManagement.Forecast',
  Landing = 'AdvertiseCreationAndManagement.Landing',
  Metadata = 'AdvertiseCreationAndManagement.Metadata',
  Misc = 'AdvertiseCreationAndManagement.Misc',
  Navigation = 'AdvertiseCreationAndManagement.Navigation',
  Report = 'AdvertiseCreationAndManagement.Report',
  Timezone = 'AdvertiseCreationAndManagement.Timezone',
  CreatorDashboardAssetTypes = 'CreatorDashboard.AssetTypes',
  CreatorDashboardControls = 'CreatorDashboard.Controls',
  Creations = 'CreatorDashboard.Creations',
  CreatorDashboardNavigation = 'CreatorDashboard.Navigation',
  CreatorDocumentationNavigation = 'CreatorDocumentation.Navigation',
}

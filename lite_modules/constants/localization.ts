import { createContext } from 'react';

import { LocaleProviderContextType } from '@type/localization';

export const LocaleProviderContext = createContext<LocaleProviderContextType | null>(null);

export enum TranslationNamespace {
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

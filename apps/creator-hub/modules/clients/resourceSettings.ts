import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { AssetApi, BundleApi, UniverseApi, PreferenceApi } from '@rbx/clients/resourceSettingsApi';
import { getBEDEV2ServiceBasePath } from './utils';

export type {
  AssetConfiguration,
  BundleConfiguration,
  UniverseConfiguration,
} from '@rbx/clients/resourceSettingsApi';
export { DataSharingLicenseType } from '@rbx/clients/resourceSettingsApi';
const basePath = getBEDEV2ServiceBasePath('resource-settings');

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

const assetApi = new AssetApi(configuration);
const bundleApi = new BundleApi(configuration);
const universeApi = new UniverseApi(configuration);
const preferenceApi = new PreferenceApi(configuration);

export const ResourceSettingsClient = { assetApi, bundleApi, universeApi, preferenceApi };

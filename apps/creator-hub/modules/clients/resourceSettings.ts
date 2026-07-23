import {
  AssetApi,
  BundleApi,
  UniverseApi,
  PreferenceApi,
} from '@rbx/client-resource-settings-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export type {
  AssetConfiguration,
  BundleConfiguration,
  UniverseConfiguration,
} from '@rbx/client-resource-settings-api/v1';
export { DataSharingLicenseType } from '@rbx/client-resource-settings-api/v1';

const configuration = createClientConfiguration('resource-settings', 'bedev2');

const assetApi = new AssetApi(configuration);
const bundleApi = new BundleApi(configuration);
const universeApi = new UniverseApi(configuration);
const preferenceApi = new PreferenceApi(configuration);

export const ResourceSettingsClient = { assetApi, bundleApi, universeApi, preferenceApi };

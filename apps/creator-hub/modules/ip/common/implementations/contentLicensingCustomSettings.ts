import contentLicensingClient from '@modules/clients/contentLicensing';
import { createCustomSettings } from '@modules/settings/implementations/createCustomSettings';
import type { ContentLicensingCustomSettings } from './ContentLicensingCustomSettingsManager';
import ContentLicensingCustomSettingsManager from './ContentLicensingCustomSettingsManager';

const contentLicensingCustomSettingsManager = new ContentLicensingCustomSettingsManager(
  contentLicensingClient,
);

const { CustomSettingsProvider, useCustomSettings } =
  createCustomSettings<ContentLicensingCustomSettings>(contentLicensingCustomSettingsManager);

export {
  CustomSettingsProvider as ContentLicensingCustomSettingsProvider,
  useCustomSettings as useContentLicensingCustomSettings,
};

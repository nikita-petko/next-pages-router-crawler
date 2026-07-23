import { createCustomSettings } from '@modules/settings';
import { contentLicensingClient } from '@modules/clients';
import ContentLicensingCustomSettingsManager, {
  ContentLicensingCustomSettings,
} from './ContentLicensingCustomSettingsManager';

const contentLicensingCustomSettingsManager = new ContentLicensingCustomSettingsManager(
  contentLicensingClient,
);

const { CustomSettingsProvider, useCustomSettings } =
  createCustomSettings<ContentLicensingCustomSettings>(contentLicensingCustomSettingsManager);

export {
  CustomSettingsProvider as ContentLicensingCustomSettingsProvider,
  useCustomSettings as useContentLicensingCustomSettings,
};

import type { CustomSettingsManager } from '@modules/settings';
import type { ContentLicensingApiClient } from '@modules/clients/contentLicensing';

export type ContentLicensingCustomSettings = {
  enableLicenseModeration: boolean;
};

export default class ContentLicensingCustomSettingsManager
  implements CustomSettingsManager<ContentLicensingCustomSettings>
{
  name?: string | undefined;

  defaultSettings: Readonly<ContentLicensingCustomSettings>;

  constructor(private contentLicensingClient: ContentLicensingApiClient) {
    this.name = 'ContentLicensingCustomSettings';
    this.defaultSettings = {
      enableLicenseModeration: false,
    };
  }

  async getSettings(): Promise<ContentLicensingCustomSettings> {
    try {
      const settingValues = await this.contentLicensingClient.getSettings();
      return {
        enableLicenseModeration: !!settingValues.EnableLicenseModeration,
      };
    } catch {
      return this.defaultSettings;
    }
  }
}

import type { ContentLicensingApiClient } from '@modules/clients/contentLicensing';
import type CustomSettingsManager from '@modules/settings/interfaces/CustomSettingsManager';

export type ContentLicensingCustomSettings = {};

export default class ContentLicensingCustomSettingsManager implements CustomSettingsManager<ContentLicensingCustomSettings> {
  name?: string | undefined;

  defaultSettings: Readonly<ContentLicensingCustomSettings>;

  constructor(private contentLicensingClient: ContentLicensingApiClient) {
    this.name = 'ContentLicensingCustomSettings';
    this.defaultSettings = {};
  }

  async getSettings(): Promise<ContentLicensingCustomSettings> {
    try {
      await this.contentLicensingClient.getSettings();
      return {};
    } catch {
      return this.defaultSettings;
    }
  }
}

import {
  LocaleApi,
  RobloxLocaleApiUserLocalizationLocusLocalesResponse,
} from '@rbx/client-locale/v1';

import BaseClient from '@modules/clients/baseClient';
import { GetBEDEV1ServiceBasePath } from '@utils/url';

class LocaleClient extends BaseClient {
  private localeApi: LocaleApi;

  constructor(basePath: string = GetBEDEV1ServiceBasePath('locale')) {
    super(basePath);

    this.localeApi = new LocaleApi(this.defaultConfiguration);
  }

  getUserLocalizationLocusSupportedLocales(): Promise<RobloxLocaleApiUserLocalizationLocusLocalesResponse> {
    return this.localeApi.v1LocalesUserLocalizationLocusSupportedLocalesGet();
  }
}

export default new LocaleClient();

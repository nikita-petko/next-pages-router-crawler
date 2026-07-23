import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  LocaleApi,
  V1LocalesGetRequest,
  RobloxLocaleApiSupportedLocale,
  RobloxLocaleApiSupportedLocaleLocus,
  V1LocalesSupportedLocalesForCreatorsGetRequest,
} from '@rbx/clients/locale';
import { getBEDEV1ServiceBasePath } from './utils';

export type LocaleRequest = V1LocalesGetRequest;
export type LocaleDataResponse = RobloxLocaleApiSupportedLocale;
export type LocaleDataArrayResponseWithUserLocus = RobloxLocaleApiSupportedLocaleLocus;

export class LocaleClient {
  private localeApi: LocaleApi;

  constructor(basePath: string = getBEDEV1ServiceBasePath('locale')) {
    const configuration = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });

    this.localeApi = new LocaleApi(configuration);
  }

  async getLocale(request: LocaleRequest) {
    return this.localeApi.v1LocalesGet(request);
  }

  async getUserLocalizationLocusSupportedLocales() {
    return this.localeApi.v1LocalesUserLocalizationLocusSupportedLocalesGet();
  }

  async getSupportedLocalesForCreators(request: V1LocalesSupportedLocalesForCreatorsGetRequest) {
    return this.localeApi.v1LocalesSupportedLocalesForCreatorsGet(request);
  }
}

const localeClient = new LocaleClient();

export default localeClient;

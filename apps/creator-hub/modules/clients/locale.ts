import type {
  V1LocalesGetRequest,
  RobloxLocaleApiSupportedLocale,
  RobloxLocaleApiSupportedLocaleLocus,
  V1LocalesSupportedLocalesForCreatorsGetRequest,
  V1LocalesSupportedLocalesForFeatureGetRequest,
} from '@rbx/client-locale/v1';
import { LocaleApi } from '@rbx/client-locale/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export type LocaleRequest = V1LocalesGetRequest;
export type LocaleDataResponse = RobloxLocaleApiSupportedLocale;
export type LocaleDataArrayResponseWithUserLocus = RobloxLocaleApiSupportedLocaleLocus;

export class LocaleClient {
  private localeApi: LocaleApi;

  constructor() {
    this.localeApi = new LocaleApi(createClientConfiguration('locale', 'bedev1'));
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

  async getSupportedLocalesForFeature(request: V1LocalesSupportedLocalesForFeatureGetRequest) {
    return this.localeApi.v1LocalesSupportedLocalesForFeatureGet(request);
  }
}

const localeClient = new LocaleClient();

export default localeClient;

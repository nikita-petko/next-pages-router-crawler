import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  CountryRegionsApi,
  RobloxLocaleApiCountryRegion,
  RobloxLocaleApiCountryRegionListResponse,
  V1CountryRegionsGetRequest,
} from '@rbx/clients/locale';
import { getBEDEV1ServiceBasePath } from './utils';

export type CountryRegionsRequest = V1CountryRegionsGetRequest;
export type CountryRegionsResponse = RobloxLocaleApiCountryRegionListResponse;
export type CountryRegion = RobloxLocaleApiCountryRegion;

export class CountryRegionsClient {
  private countryRegionsApi: CountryRegionsApi;

  constructor(basePath: string = getBEDEV1ServiceBasePath('locale')) {
    const defaultConfiguration = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });

    this.countryRegionsApi = new CountryRegionsApi(defaultConfiguration);
  }

  getCountryRegions(request: CountryRegionsRequest): Promise<CountryRegionsResponse> {
    return this.countryRegionsApi.v1CountryRegionsGet(request);
  }
}

const countryRegionsClient = new CountryRegionsClient();

export default countryRegionsClient;

import type {
  RobloxLocaleApiCountryRegion,
  RobloxLocaleApiCountryRegionListResponse,
  V1CountryRegionsGetRequest,
} from '@rbx/client-locale/v1';
import { CountryRegionsApi } from '@rbx/client-locale/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export type CountryRegionsRequest = V1CountryRegionsGetRequest;
export type CountryRegionsResponse = RobloxLocaleApiCountryRegionListResponse;
export type CountryRegion = RobloxLocaleApiCountryRegion;

export class CountryRegionsClient {
  private countryRegionsApi: CountryRegionsApi;

  constructor() {
    this.countryRegionsApi = new CountryRegionsApi(createClientConfiguration('locale', 'bedev1'));
  }

  getCountryRegions(request: CountryRegionsRequest): Promise<CountryRegionsResponse> {
    return this.countryRegionsApi.v1CountryRegionsGet(request);
  }
}

const countryRegionsClient = new CountryRegionsClient();

export default countryRegionsClient;

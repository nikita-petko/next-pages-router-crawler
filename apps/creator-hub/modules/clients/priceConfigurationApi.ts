import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  PriceConfigurationApiApi as PriceConfigurationApi,
  PriceConfigurationPublicApiApi as PriceConfigurationPublicApi,
  SetUniverseFixedPriceRequest,
  SetUniversePinnedLocationRequest,
} from '@rbx/clients/priceConfigurationApi';
import { RegionalPricingPreviewProductType as ProductType } from '@rbx/clients/priceConfigurationApi/v1';
import { getBEDEV2ServiceBasePath } from './utils';

export type RegionalPricingPreviewProductType = ProductType;

export class PriceConfigurationApiClient {
  private priceConfigurationApi: PriceConfigurationApi;

  private priceConfigurationPublicApi: PriceConfigurationPublicApi;

  constructor(basePath: string = getBEDEV2ServiceBasePath('price-configuration-api')) {
    const configuration = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });

    this.priceConfigurationApi = new PriceConfigurationApi(configuration);
    this.priceConfigurationPublicApi = new PriceConfigurationPublicApi(configuration);
  }

  async getTopCountriesByEarnings(universeId: number, initOverrides?: RequestInit) {
    return this.priceConfigurationApi.priceConfigurationApiGetTopCountriesByEarnings(
      { universeId },
      initOverrides,
    );
  }

  async getUniverseFixedPrice(universeId: number, initOverrides?: RequestInit) {
    return this.priceConfigurationApi.priceConfigurationApiGetUniverseFixedPrice(
      { universeId },
      initOverrides,
    );
  }

  async setUniverseFixedPrice(
    universeId: number,
    requestParameters: SetUniverseFixedPriceRequest,
    initOverrides?: RequestInit,
  ) {
    return this.priceConfigurationApi.priceConfigurationApiSetUniverseFixedPrice(
      { universeId, priceConfigurationApiSetUniverseFixedPriceRequest: requestParameters },
      initOverrides,
    );
  }

  async getSupportedCountries(initOverrides?: RequestInit) {
    return this.priceConfigurationPublicApi.priceConfigurationPublicApiGetSupportedCountries(
      initOverrides,
    );
  }

  async getUniversePinnedLocation(universeId: number, initOverrides?: RequestInit) {
    return this.priceConfigurationApi.priceConfigurationApiGetUniversePinnedLocation(
      { universeId },
      initOverrides,
    );
  }

  async setUniversePinnedLocation(
    universeId: number,
    requestParameters: SetUniversePinnedLocationRequest,
    initOverrides?: RequestInit,
  ) {
    return this.priceConfigurationApi.priceConfigurationApiSetUniversePinnedLocation(
      { universeId, priceConfigurationApiSetUniversePinnedLocationRequest: requestParameters },
      initOverrides,
    );
  }

  async getManagedPricingStatus(universeId: number, initOverrides?: RequestInit) {
    return this.priceConfigurationApi.priceConfigurationApiGetManagedPricingStatus(
      { universeId },
      initOverrides,
    );
  }

  async acceptManagedPricing(universeId: number, initOverrides?: RequestInit) {
    return this.priceConfigurationApi.priceConfigurationApiAcceptManagedPricing(
      { universeId },
      initOverrides,
    );
  }

  async getRegionalPricingPreview(
    universeId: number,
    productType: RegionalPricingPreviewProductType,
    price: number,
    initOverrides?: RequestInit,
  ) {
    return this.priceConfigurationApi.priceConfigurationApiGetRegionalPricingPreview(
      { universeId, productType, price },
      initOverrides,
    );
  }

  async getManagedPricingSummary(universeId: number, initOverrides?: RequestInit) {
    return this.priceConfigurationApi.priceConfigurationApiGetManagedPricingSummary(
      { universeId },
      initOverrides,
    );
  }
}

const priceConfigurationApiClient = new PriceConfigurationApiClient();
export default priceConfigurationApiClient;

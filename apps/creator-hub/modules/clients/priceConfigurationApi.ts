import type {
  SetUniversePinnedLocationRequest,
  RegionalPricingPreviewProductType as ProductType,
  UniversePinnedLocation,
  UniversePinningStatus,
  UniversePinningTargetStatus,
  SetUniversePinnedPriceRequest,
} from '@rbx/client-price-configuration-api/v1';
import {
  PriceConfigurationApiApi as PriceConfigurationApi,
  PriceConfigurationPublicApiApi as PriceConfigurationPublicApi,
} from '@rbx/client-price-configuration-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export type RegionalPricingPreviewProductType = ProductType;
export type { UniversePinnedLocation, UniversePinningStatus, UniversePinningTargetStatus };

export class PriceConfigurationApiClient {
  private priceConfigurationApi: PriceConfigurationApi;

  private priceConfigurationPublicApi: PriceConfigurationPublicApi;

  constructor() {
    const configuration = createClientConfiguration('price-configuration-api', 'bedev2');

    this.priceConfigurationApi = new PriceConfigurationApi(configuration);
    this.priceConfigurationPublicApi = new PriceConfigurationPublicApi(configuration);
  }

  async getTopCountriesByEarnings(universeId: number, initOverrides?: RequestInit) {
    return this.priceConfigurationApi.priceConfigurationApiGetTopCountriesByEarnings(
      { universeId },
      initOverrides,
    );
  }

  async getUniversePinnedPrice(universeId: number, initOverrides?: RequestInit) {
    return this.priceConfigurationApi.priceConfigurationApiGetUniversePinnedPrice(
      { universeId },
      initOverrides,
    );
  }

  async setUniversePinnedPrice(
    universeId: number,
    requestParameters: SetUniversePinnedPriceRequest,
    initOverrides?: RequestInit,
  ) {
    return this.priceConfigurationApi.priceConfigurationApiSetUniversePinnedPrice(
      { universeId, priceConfigurationApiSetUniversePinnedPriceRequest: requestParameters },
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

  async listManagedPricingEventsByUniverse(
    universeId: number,
    params?: { pageToken?: string; pageSize?: number },
    initOverrides?: RequestInit,
  ) {
    return this.priceConfigurationApi.priceConfigurationApiListManagedPricingEventsByUniverse(
      { universeId, ...params },
      initOverrides,
    );
  }

  async getManagedPricingEvent(universeId: number, eventId: string, initOverrides?: RequestInit) {
    return this.priceConfigurationApi.priceConfigurationApiGetManagedPricingEvent(
      { universeId, eventId },
      initOverrides,
    );
  }

  async getManagedPricingMetadata(universeId: number, initOverrides?: RequestInit) {
    return this.priceConfigurationApi.priceConfigurationApiGetManagedPricingMetadata(
      { universeId },
      initOverrides,
    );
  }

  async rescheduleManagedPricingEvent(
    universeId: number,
    eventId: string,
    requestParameters: { newStartTime: Date },
    initOverrides?: RequestInit,
  ) {
    return this.priceConfigurationApi.priceConfigurationApiRescheduleManagedPricingEvent(
      {
        universeId,
        eventId,
        priceConfigurationApiRescheduleManagedPricingEventRequest: requestParameters,
      },
      initOverrides,
    );
  }

  async getHardCodedPricesSummary(universeId: number, initOverrides?: RequestInit) {
    return this.priceConfigurationApi.priceConfigurationApiGetHardCodedPricesSummary(
      { universeId },
      initOverrides,
    );
  }

  async listHardCodedPrices(
    universeId: number,
    params?: { scanJobId?: string; pageToken?: string; pageSize?: number },
    initOverrides?: RequestInit,
  ) {
    return this.priceConfigurationApi.priceConfigurationApiListHardCodedPrices(
      { universeId, ...params },
      initOverrides,
    );
  }
}

const priceConfigurationApiClient = new PriceConfigurationApiClient();
export default priceConfigurationApiClient;

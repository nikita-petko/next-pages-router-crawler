import type {
  RobloxMarketplaceFiatSharedV1Beta1BasePriceMapping as BasePriceMapping,
  V1PricesProductNamespaceProductTypeGetRequest,
  V1SellerPayoutsGetRequest,
  V1PurchaserPaymentsGetRequest,
  V1PurchaserReportPaymentsGetRequest,
  V1SellerPaymentsGetRequest,
  V1SellerReportPaymentsGetRequest,
  RobloxMarketplaceFiatSharedV1Beta1ProductType as ProductType,
  RobloxMarketplaceFiatMarketplaceFiatAccountServiceV1Beta1GetPurchaserPaymentsResponse as GetPurchaserPaymentsResponse,
  RobloxMarketplaceFiatMarketplaceFiatAccountServiceV1Beta1GetSellerAccountBalanceResponse as SellerAccountBalanceResponse,
  RobloxMarketplaceFiatMarketplaceFiatAccountServiceV1Beta1GetSellerStatusResponse as GetSellerStatusResponse,
  RobloxMarketplaceFiatMarketplaceFiatAccountServiceV1Beta1GetSellerPayoutsResponse as GetSellerPayoutsResponse,
  RobloxMarketplaceFiatMarketplaceFiatAccountServiceV1Beta1GetSellerPayoutsTotalResponse as GetSellerPayoutsTotalResponse,
  RobloxMarketplaceFiatMarketplaceFiatAccountServiceV1Beta1GetSellerPaymentsResponse as GetSellerPaymentsResponse,
  RobloxMarketplaceFiatMarketplaceFiatAccountServiceV1Beta1OnboardSellerResponse as OnboardSellerResponse,
  V1SellerProductsProductTypeGetRequest,
  RobloxMarketplaceFiatMarketplaceFiatAccountServiceV1Beta1GetSellerFiatProductsResponse,
  RobloxMarketplaceFiatSharedV1Beta1PurchasePriceFilter as PurchasePriceFilter,
  MarketplaceFiatServiceModelsPriceFilter,
} from '@rbx/client-marketplace-fiat-service/v1';
import {
  PriceApi,
  AccountApi,
  ReportDownloadApi,
  RobloxPaymentsSharedV1ProductNamespace as ProductNamespace,
} from '@rbx/client-marketplace-fiat-service/v1';
import { createClientConfiguration } from '../utils/createClientConfiguration';

class MarketplaceFiatClient {
  private accountApi: AccountApi;

  private priceApi: PriceApi;

  private reportDownloadApi: ReportDownloadApi;

  constructor() {
    const configuration = createClientConfiguration('marketplace-fiat-service', 'bedev2');

    this.accountApi = new AccountApi(configuration);
    this.priceApi = new PriceApi(configuration);
    this.reportDownloadApi = new ReportDownloadApi(configuration);
  }

  async getSellerAuthorizedCountries(): Promise<string[]> {
    // oxlint-disable-next-line prefer-nullish-coalescing -- intentionally coerces falsy (e.g. null) to empty array
    return (await this.accountApi.v1SellerAuthorizedCountryCodesGet()).countryCodes || [];
  }

  async getSellerAccountBalance(): Promise<SellerAccountBalanceResponse> {
    return this.accountApi.v1SellerBalanceGet();
  }

  async getSellerStatus(): Promise<GetSellerStatusResponse> {
    return this.accountApi.v1SellerStatusGet();
  }

  async getSellerPayouts(
    pageSize?: number,
    cursor?: string,
    previous?: boolean,
  ): Promise<GetSellerPayoutsResponse> {
    const requestParameters: V1SellerPayoutsGetRequest = {
      pageInfoPageSize: pageSize,
      pageInfoCursor: cursor,
      pageInfoPrevious: previous,
    };
    return this.accountApi.v1SellerPayoutsGet(requestParameters);
  }

  async getSellerPayoutsTotal(): Promise<GetSellerPayoutsTotalResponse> {
    return this.accountApi.v1SellerPayoutsTotalGet();
  }

  async getSellerPayments(
    pageSize?: number,
    cursor?: string,
    previous?: boolean,
    startDate?: Date,
    endDate?: Date,
    priceFilter?: PurchasePriceFilter,
  ): Promise<GetSellerPaymentsResponse> {
    const requestParameters: V1SellerPaymentsGetRequest = {
      pageInfoPageSize: pageSize,
      pageInfoCursor: cursor,
      pageInfoPrevious: previous,
      startDateTime: startDate,
      endDateTime: endDate,
      purchasePriceFilter: priceFilter,
    };
    return this.accountApi.v1SellerPaymentsGet(requestParameters);
  }

  async getPurchaserPayments(
    pageSize?: number,
    cursor?: string,
    previous?: boolean,
    startDate?: Date,
    endDate?: Date,
    priceFilter?: PurchasePriceFilter,
  ): Promise<GetPurchaserPaymentsResponse> {
    const requestParameters: V1PurchaserPaymentsGetRequest = {
      pageInfoPageSize: pageSize,
      pageInfoCursor: cursor,
      pageInfoPrevious: previous,
      startDateTime: startDate,
      endDateTime: endDate,
      purchasePriceFilter: priceFilter,
    };
    return this.accountApi.v1PurchaserPaymentsGet(requestParameters);
  }

  async getPrices(productType: ProductType): Promise<BasePriceMapping[]> {
    const requestParameters: V1PricesProductNamespaceProductTypeGetRequest = {
      productNamespace: ProductNamespace.CreatorMarketplaceAsset,
      productType,
    };
    return (
      // oxlint-disable-next-line prefer-nullish-coalescing -- intentionally coerces falsy (e.g. null) to empty array
      (await this.priceApi.v1PricesProductNamespaceProductTypeGet(requestParameters)).basePrices ||
      []
    );
  }

  async onboardSeller(
    countryCode: string,
    acceptedUserTos: boolean,
  ): Promise<OnboardSellerResponse> {
    return this.accountApi.v1SellerOnboardPost({
      countryCode,
      acceptedUserTos,
    });
  }

  async getPurchaserPaymentsReport(
    startDate?: Date,
    endDate?: Date,
    priceFilter?: MarketplaceFiatServiceModelsPriceFilter,
  ): Promise<Blob> {
    const requestParameters: V1PurchaserReportPaymentsGetRequest = {
      startDate,
      endDate,
      purchasePriceFilter: priceFilter,
    };
    return this.reportDownloadApi.v1PurchaserReportPaymentsGet(requestParameters);
  }

  async getSellerPaymentsReport(
    startDate?: Date,
    endDate?: Date,
    priceFilter?: MarketplaceFiatServiceModelsPriceFilter,
  ): Promise<Blob> {
    const requestParameters: V1SellerReportPaymentsGetRequest = {
      startDate,
      endDate,
      purchasePriceFilter: priceFilter,
    };
    return this.reportDownloadApi.v1SellerReportPaymentsGet(requestParameters);
  }

  async getSellerFiatProducts(
    productType: ProductType,
    isFree: boolean,
    isPurchasablePerSeller: boolean,
    includePricing: boolean,
    pageInfoPageSize: number,
    pageInfoCursor?: string,
    pageInfoPrevious?: boolean,
  ): Promise<RobloxMarketplaceFiatMarketplaceFiatAccountServiceV1Beta1GetSellerFiatProductsResponse> {
    const requestParameters: V1SellerProductsProductTypeGetRequest = {
      productType,
      isFree,
      isPurchasablePerSeller,
      includePricing,
      pageInfoPageSize,
      pageInfoCursor,
      pageInfoPrevious,
    };
    return this.accountApi.v1SellerProductsProductTypeGet(requestParameters);
  }
}

const marketplaceFiatClient = new MarketplaceFiatClient();
export default marketplaceFiatClient;

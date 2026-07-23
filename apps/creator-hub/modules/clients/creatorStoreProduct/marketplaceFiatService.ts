import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  RobloxMarketplaceFiatSharedV1Beta1BasePriceMapping as BasePriceMapping,
  PriceApi,
  AccountApi,
  ReportDownloadApi,
  V1PricesProductNamespaceProductTypeGetRequest,
  V1SellerPayoutsGetRequest,
  V1PurchaserPaymentsGetRequest,
  V1PurchaserReportPaymentsGetRequest,
  V1SellerPaymentsGetRequest,
  V1SellerReportPaymentsGetRequest,
  RobloxPaymentsSharedV1ProductNamespace as ProductNamespace,
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
} from '@rbx/clients/marketplaceFiatService';

import { getBEDEV2ServiceBasePath } from '../utils';

class MarketplaceFiatClient {
  private accountApi: AccountApi;

  private priceApi: PriceApi;

  private reportDownloadApi: ReportDownloadApi;

  constructor(basePath = getBEDEV2ServiceBasePath('marketplace-fiat-service')) {
    const configuration = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });

    this.accountApi = new AccountApi(configuration);
    this.priceApi = new PriceApi(configuration);
    this.reportDownloadApi = new ReportDownloadApi(configuration);
  }

  async getSellerAuthorizedCountries(): Promise<string[]> {
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

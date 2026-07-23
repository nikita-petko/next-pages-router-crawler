import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  DeveloperSubscriptionProductsApi,
  DeveloperSubscriptionProductApiResponseModel,
  GetDeveloperSubscriptionProductsByUniverseResponse,
  GetExperienceAppStoreNameByUniverseIdResponse,
  CreateDeveloperSubscriptionProductResponse,
  DeveloperSubscriptionProductType,
  GetDeveloperSubscriptionPermissionResponse,
  UploadDeveloperSubscriptionImageResponse,
  UpdateDeveloperSubscriptionProductResponse,
  GetDeveloperSubscriptionPricingResponse,
  ProductStatusType,
  FailureReason,
  GetDeveloperSubscriptionsAnalyticsRequest,
  GetDeveloperSubscriptionsAnalyticsResponse,
  DeveloperSubscriptionsAnalyticsDimension,
  DeveloperSubscriptionsAnalyticsMetric,
  MetricGranularity,
  GetOrSuggestShortenedExperienceNameResponse,
  ConfirmShortenedExperienceNameRequest,
  CurrencyType,
} from '@rbx/clients/developerSubscriptionsApi';

// eslint-disable-next-line no-restricted-imports -- Legacy APIs
import { ExperienceSubscriptionsChartKey } from '@modules/experience-subscriptions/types/ExperienceSubscriptionsChartSpec';
import { getBEDEV2ServiceBasePath } from './utils';

export type {
  DeveloperSubscriptionProductApiResponseModel as GetExperienceSubscriptionResponse,
  GetOrSuggestShortenedExperienceNameResponse,
  ConfirmShortenedExperienceNameRequest,
  DeveloperSubscriptionProductType,
  ProductStatusType,
};

export { FailureReason as ExperienceSubscriptionFailureReason };

export class ExperienceSubscriptionsApiClient {
  private developerSubscriptionsApi;

  constructor(basePathAuth: string = getBEDEV2ServiceBasePath('experience-subscriptions')) {
    this.developerSubscriptionsApi = new DeveloperSubscriptionProductsApi(
      new Configuration({
        robloxSiteDomain: process.env.robloxSiteDomain,
        basePath: basePathAuth,
        credentials: 'include',
        unifiedLogger: unifiedLoggerClient,
      }),
    );
  }

  canUserAccessSubscriptions(
    universeId: number,
  ): Promise<GetDeveloperSubscriptionPermissionResponse> {
    return this.developerSubscriptionsApi.developerSubscriptionProductsGetDeveloperSubscriptionPermission(
      { experienceId: universeId },
    );
  }

  uploadImage(
    universeId: number,
    subscriptionId: string,
    actingUserId: number,
    imageFile: Blob,
  ): Promise<UploadDeveloperSubscriptionImageResponse> {
    return this.developerSubscriptionsApi.developerSubscriptionProductsUploadDeveloperSubscriptionImage(
      { experienceId: universeId, subscriptionProductId: subscriptionId, actingUserId, imageFile },
    );
  }

  getExperienceSubscription(
    universeId: number,
    subscriptionId: string,
  ): Promise<DeveloperSubscriptionProductApiResponseModel> {
    return this.developerSubscriptionsApi.developerSubscriptionProductsGetDeveloperSubscriptionProductById(
      {
        experienceId: universeId,
        subscriptionProductId: subscriptionId,
      },
    );
  }

  getExperienceSubscriptions(
    universeId: number,
    cursor: string | undefined,
    resultsPerPage = 50,
  ): Promise<GetDeveloperSubscriptionProductsByUniverseResponse> {
    return this.developerSubscriptionsApi.developerSubscriptionProductsGetDeveloperSubscriptionProductsByUniverse(
      {
        experienceId: universeId,
        cursor,
        resultsPerPage,
      },
    );
  }

  getExperienceAppStoreName(
    universeId: number,
  ): Promise<GetExperienceAppStoreNameByUniverseIdResponse> {
    return this.developerSubscriptionsApi.developerSubscriptionProductsGetExperienceAppStoreNameByUniverseId(
      { experienceId: universeId },
    );
  }

  createExperienceSubscription(
    universeId: number,
    productName: string,
    productDescription: string,
    productType: DeveloperSubscriptionProductType,
    basePriceId: string | null,
    currencyType: CurrencyType,
    priceInRobux: number | null,
    isRegionalPricingEnabled: boolean,
  ): Promise<CreateDeveloperSubscriptionProductResponse> {
    return this.developerSubscriptionsApi.developerSubscriptionProductsCreateDeveloperSubscriptionProduct(
      {
        experienceId: universeId,
        developerSubscriptionProductsCreateDeveloperSubscriptionProductRequest: {
          productName,
          productDescription,
          productType,
          basePriceId,
          currencyType,
          priceInRobux,
          isRegionalPricingEnabled,
        },
      },
    );
  }

  updateExperienceSubscription(
    universeId: number,
    subscriptionId: string,
    imageAssetId: number,
    description: string,
    currencyType?: CurrencyType,
    basePriceId?: string,
    priceInRobux?: number,
    isRegionalPricingEnabled?: boolean,
  ): Promise<UpdateDeveloperSubscriptionProductResponse> {
    return this.developerSubscriptionsApi.developerSubscriptionProductsUpdateDeveloperSubscriptionProduct(
      {
        experienceId: universeId,
        subscriptionProductId: subscriptionId,
        developerSubscriptionProductsUpdateDeveloperSubscriptionProductRequest: {
          imageAssetId,
          description,
          currencyType,
          basePriceId,
          priceInRobux,
          isRegionalPricingEnabled,
        },
      },
    );
  }

  activateExperienceSubscription(
    universeId: number,
    subscriptionId: string,
  ): Promise<UpdateDeveloperSubscriptionProductResponse> {
    return this.developerSubscriptionsApi.developerSubscriptionProductsActivateDeveloperSubscription(
      {
        experienceId: universeId,
        subscriptionProductId: subscriptionId,
      },
    );
  }

  deactivateExperienceSubscription(
    universeId: number,
    subscriptionId: string,
    cancelRenewals: boolean,
  ): Promise<UpdateDeveloperSubscriptionProductResponse> {
    return this.developerSubscriptionsApi.developerSubscriptionProductsDeactivateDeveloperSubscription(
      {
        experienceId: universeId,
        subscriptionProductId: subscriptionId,
        cancelRenewals,
      },
    );
  }

  deleteExperienceSubscription(
    universeId: number,
    subscriptionId: string,
  ): Promise<UpdateDeveloperSubscriptionProductResponse> {
    return this.developerSubscriptionsApi.developerSubscriptionProductsDeleteDeveloperSubscription({
      experienceId: universeId,
      subscriptionProductId: subscriptionId,
    });
  }

  getPriceInfo(universeId: number): Promise<GetDeveloperSubscriptionPricingResponse> {
    return this.developerSubscriptionsApi.developerSubscriptionProductsGetDeveloperSubscriptionPricing(
      { experienceId: universeId },
    );
  }

  getAnalytics(
    metric: DeveloperSubscriptionsAnalyticsMetric,
    breakdown: DeveloperSubscriptionsAnalyticsDimension[] | null,
    startDate: Date,
    endDate: Date,
    universeId: number,
    productFilter: string | null,
    granularity: MetricGranularity,
  ): Promise<GetDeveloperSubscriptionsAnalyticsResponse> {
    const requestBody: GetDeveloperSubscriptionsAnalyticsRequest = {
      metric,
      granularity,
      startTime: startDate,
      endTime: endDate,
      breakdown,
      filter: productFilter
        ? [
            {
              dimension: DeveloperSubscriptionsAnalyticsDimension.DeveloperSubscriptionProduct,
              values: [productFilter],
            },
          ]
        : [],
    };

    return this.developerSubscriptionsApi.developerSubscriptionProductsGetDeveloperSubscriptionsAnalytics(
      {
        experienceId: universeId,
        developerSubscriptionProductsGetDeveloperSubscriptionsAnalyticsRequest: requestBody,
      },
    );
  }

  getChartAnalytics(
    chartKey: ExperienceSubscriptionsChartKey,
    startDate: Date,
    endDate: Date,
    universeId: number,
    productFilter: string | null,
  ): Promise<GetDeveloperSubscriptionsAnalyticsResponse> {
    let metric: DeveloperSubscriptionsAnalyticsMetric | null = null;
    let breakdown: DeveloperSubscriptionsAnalyticsDimension[] | null = null;
    switch (chartKey) {
      case ExperienceSubscriptionsChartKey.Sales: {
        metric = DeveloperSubscriptionsAnalyticsMetric.DeveloperSubscriptionSales;
        breakdown = [];
        break;
      }
      case ExperienceSubscriptionsChartKey.SalesByProduct: {
        metric = DeveloperSubscriptionsAnalyticsMetric.DeveloperSubscriptionSales;
        breakdown = [DeveloperSubscriptionsAnalyticsDimension.DeveloperSubscriptionProduct];
        break;
      }
      case ExperienceSubscriptionsChartKey.SalesBySubscriptionType: {
        metric = DeveloperSubscriptionsAnalyticsMetric.DeveloperSubscriptionSales;
        breakdown = [DeveloperSubscriptionsAnalyticsDimension.SubscriptionType];
        break;
      }
      case ExperienceSubscriptionsChartKey.SalesByPlatform: {
        metric = DeveloperSubscriptionsAnalyticsMetric.DeveloperSubscriptionSales;
        breakdown = [DeveloperSubscriptionsAnalyticsDimension.PurchasePlatform];
        break;
      }
      case ExperienceSubscriptionsChartKey.Revenue: {
        metric = DeveloperSubscriptionsAnalyticsMetric.DeveloperSubscriptionRevenue;
        breakdown = [];
        break;
      }
      case ExperienceSubscriptionsChartKey.RevenueByProduct: {
        metric = DeveloperSubscriptionsAnalyticsMetric.DeveloperSubscriptionRevenue;
        breakdown = [DeveloperSubscriptionsAnalyticsDimension.DeveloperSubscriptionProduct];
        break;
      }
      case ExperienceSubscriptionsChartKey.RevenueByPlatform: {
        metric = DeveloperSubscriptionsAnalyticsMetric.DeveloperSubscriptionRevenue;
        breakdown = [DeveloperSubscriptionsAnalyticsDimension.PurchasePlatform];
        break;
      }
      case ExperienceSubscriptionsChartKey.CancellationsBySubscriptionType: {
        metric = DeveloperSubscriptionsAnalyticsMetric.DeveloperSubscriptionCancellations;
        breakdown = [DeveloperSubscriptionsAnalyticsDimension.SubscriptionType];
        break;
      }
      default: {
        const exhaustiveCheck: never = chartKey;
        throw new Error(`Unrecognized chartKey ${exhaustiveCheck}.`);
      }
    }

    const requestBody: GetDeveloperSubscriptionsAnalyticsRequest = {
      metric,
      granularity: MetricGranularity.Day,
      startTime: startDate,
      endTime: endDate,
      breakdown,
      filter: productFilter
        ? [
            {
              dimension: DeveloperSubscriptionsAnalyticsDimension.DeveloperSubscriptionProduct,
              values: [productFilter],
            },
          ]
        : [],
    };

    return this.developerSubscriptionsApi.developerSubscriptionProductsGetDeveloperSubscriptionsAnalytics(
      {
        experienceId: universeId,
        developerSubscriptionProductsGetDeveloperSubscriptionsAnalyticsRequest: requestBody,
      },
    );
  }

  getOrSuggestShortenedExperienceName(
    universeId: number,
  ): Promise<GetOrSuggestShortenedExperienceNameResponse> {
    return this.developerSubscriptionsApi.developerSubscriptionProductsGetOrSuggestShortenedExperienceName(
      {
        experienceId: universeId,
      },
    );
  }

  // Intentional due to the payload of confirm being empty
  confirmShortenedExperienceName(universeId: number, shortenedName: string): Promise<unknown> {
    return this.developerSubscriptionsApi.developerSubscriptionProductsConfirmShortenedExperienceName(
      {
        experienceId: universeId,
        confirmShortenedExperienceNameRequest: {
          shortenedName,
        },
      },
    );
  }
}

const experienceSubscriptionsClient = new ExperienceSubscriptionsApiClient();
export default experienceSubscriptionsClient;

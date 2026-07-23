import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { marketplaceFiatService, openCloudCreatorStoreProduct } from '@modules/clients';

import {
  RobloxMarketplaceFiatMarketplaceFiatAccountServiceV1Beta1GetSellerAccountBalanceResponse as SellerAccountBalanceResponse,
  RobloxMarketplaceFiatMarketplaceFiatAccountServiceV1Beta1GetPurchaserPaymentsResponse as GetPurchaserPaymentsResponse,
  RobloxMarketplaceFiatMarketplaceFiatAccountServiceV1Beta1GetSellerStatusResponse as GetSellerStatusResponse,
  RobloxMarketplaceFiatMarketplaceFiatAccountServiceV1Beta1GetSellerPayoutsResponse as GetSellerPayoutsResponse,
  RobloxMarketplaceFiatMarketplaceFiatAccountServiceV1Beta1GetSellerPayoutsTotalResponse as GetSellerPayoutsTotalResponse,
  RobloxMarketplaceFiatMarketplaceFiatAccountServiceV1Beta1GetSellerPaymentsResponse as GetSellerPaymentsResponse,
  RobloxMarketplaceFiatSharedV1Beta1ProductType as ProductType,
  RobloxMarketplaceFiatSharedV1Beta1BasePriceMapping as BasePriceMapping,
  RobloxMarketplaceFiatSharedV1Beta1PurchasePriceFilter as PurchasePriceFilter,
} from '@rbx/clients/marketplaceFiatService';
import { CreatorStoreProduct } from '@modules/clients/creatorStoreProduct/openCloudCreatorStoreProduct';
import { FREE_BASE_PRICE } from './utils/fiatUtils';

// NOTE: This is needed to prevent query key clashes since the query key isn’t affected by which file it is in.
const KEY_PREFIX = 'marketplaceFiatService_';

export function getFetchCreatorStoreProductKey(assetId: string, productType: ProductType) {
  return [`${KEY_PREFIX}fetchProduct`, assetId, productType];
}

export function useFetchSellerAccountBalance(
  isEnabled: boolean = true,
): UseQueryResult<SellerAccountBalanceResponse> {
  return useQuery({
    enabled: isEnabled,
    queryKey: [`${KEY_PREFIX}fetchSellerAccountBalance`],
    queryFn: async () => {
      const result = await marketplaceFiatService.getSellerAccountBalance();
      return result;
    },
  });
}

export function useFetchSellerStatus(): UseQueryResult<GetSellerStatusResponse> {
  return useQuery({
    queryKey: [`${KEY_PREFIX}fetchSellerStatus`],
    queryFn: async () => {
      const result = await marketplaceFiatService.getSellerStatus();
      return result;
    },
  });
}

export function useFetchAuthorizedCountries(): UseQueryResult<Map<string, boolean>> {
  return useQuery({
    queryKey: [`${KEY_PREFIX}fetchAuthorizedCountries`],
    queryFn: async () => {
      const result = await marketplaceFiatService.getSellerAuthorizedCountries();
      const countriesMap = new Map();
      result.forEach((country) => {
        countriesMap.set(country, true);
      });
      return countriesMap;
    },
  });
}

export function useFetchSellerPayouts(
  pageSize?: number,
  cursor?: string,
  previous?: boolean,
  enabled: boolean = true,
): UseQueryResult<GetSellerPayoutsResponse> {
  return useQuery({
    enabled,
    queryKey: [`${KEY_PREFIX}fetchSellerPayouts`, pageSize, cursor, previous],
    queryFn: async () => {
      const result = await marketplaceFiatService.getSellerPayouts(pageSize, cursor, previous);
      return result;
    },
  });
}

export function useFetchSellerPayoutsTotal(
  enabled: boolean = true,
): UseQueryResult<GetSellerPayoutsTotalResponse> {
  return useQuery({
    enabled,
    queryKey: [`${KEY_PREFIX}fetchSellerPayoutsTotal`],
    queryFn: async () => {
      const result = await marketplaceFiatService.getSellerPayoutsTotal();
      return result;
    },
  });
}

// AKA IncomingPayments
export function useFetchSellerPayments(
  pageSize?: number,
  cursor?: string,
  previous?: boolean,
  startDate?: Date,
  endDate?: Date,
  priceFilter?: PurchasePriceFilter,
  enabled: boolean = true,
): UseQueryResult<GetSellerPaymentsResponse> {
  return useQuery({
    enabled,
    queryKey: [
      `${KEY_PREFIX}fetchSellerPayments`,
      pageSize,
      cursor,
      previous,
      startDate,
      endDate,
      priceFilter,
    ],
    queryFn: async () => {
      const result = await marketplaceFiatService.getSellerPayments(
        pageSize,
        cursor,
        previous,
        startDate,
        endDate,
        priceFilter,
      );
      return result;
    },
  });
}

// AKA OutgoingPayments
export function useFetchPurchaserPayments(
  pageSize?: number,
  cursor?: string,
  previous?: boolean,
  startDate?: Date,
  endDate?: Date,
  priceFilter?: PurchasePriceFilter,
  enabled: boolean = true,
): UseQueryResult<GetPurchaserPaymentsResponse> {
  return useQuery({
    enabled,
    queryKey: [
      `${KEY_PREFIX}fetchPurchaserPayments`,
      pageSize,
      cursor,
      previous,
      startDate,
      endDate,
      priceFilter,
    ],
    queryFn: async () => {
      const result = await marketplaceFiatService.getPurchaserPayments(
        pageSize,
        cursor,
        previous,
        startDate,
        endDate,
        priceFilter,
      );
      return result;
    },
  });
}

// Fetch base prices for product type
export function useFetchPrices(
  productType: ProductType,
  enabled: boolean = true,
): UseQueryResult<BasePriceMapping[]> {
  return useQuery({
    enabled,
    queryKey: [`${KEY_PREFIX}fetchPrices`, productType],
    queryFn: async () => {
      const result = await marketplaceFiatService.getPrices(productType);
      return result;
    },
  });
}

// Fetch fiat product
export function useFetchProduct(
  assetId: string,
  productType: ProductType,
  enabled: boolean = true,
): UseQueryResult<CreatorStoreProduct> {
  return useQuery({
    enabled,
    queryKey: getFetchCreatorStoreProductKey(assetId, productType),
    queryFn: async () => {
      // Fiat products are not guaranteed to exist: they do not exist for private assets
      try {
        const result = await openCloudCreatorStoreProduct.getProduct(assetId, productType);
        return result;
      } catch {
        return {
          published: false,
          purchasable: false,
          basePrice: FREE_BASE_PRICE,
        } as CreatorStoreProduct;
      }
    },
  });
}

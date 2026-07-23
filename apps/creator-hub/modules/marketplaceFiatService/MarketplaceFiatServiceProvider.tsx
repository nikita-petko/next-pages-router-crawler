import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { marketplaceFiatService, openCloudCreatorStoreProduct } from '@modules/clients';
import {
  RobloxMarketplaceFiatSharedV1Beta1BasePriceMapping as BasePriceMapping,
  RobloxMarketplaceFiatSharedV1Beta1ProductType as ProductType,
  RobloxMarketplaceFiatSharedV1Beta1PurchasePriceFilter as PurchasePriceFilter,
  MarketplaceFiatServiceModelsPriceFilter,
} from '@rbx/clients/marketplaceFiatService';
import {
  CreatorStoreProduct,
  Money,
} from '@modules/clients/creatorStoreProduct/openCloudCreatorStoreProduct';
import { Asset } from '@modules/miscellaneous/common';
import { V2CloudProtos } from '@rbx/open-cloud';
import { useQueryClient } from '@tanstack/react-query';
import { getFetchCreatorStoreProductKey } from './MarketplaceFiatServiceQueries';
import { FREE_BASE_PRICE } from './utils/fiatUtils';

export type CreatorStoreProductConfiguration = {
  assetId: string;
  published: boolean;
  productType: ProductType;
  basePrice?: Money;
};

export type MarketplaceFiatServiceProvider = {
  children?: React.ReactNode;
};
export type MarketplaceFiatServiceProviderContext = {
  configureProduct: (
    creatorStoreProductConfiguration: CreatorStoreProductConfiguration,
  ) => Promise<CreatorStoreProduct>;
  fetchBasePrices: (productType: ProductType) => Promise<BasePriceMapping[]>;
  fetchProduct: (
    assetId: string,
    productType: ProductType,
  ) => Promise<V2CloudProtos.ICreatorStoreProduct | null>;
  fetchSellerPaymentsReport: (
    startDate?: Date,
    endDate?: Date,
    priceFilter?: PurchasePriceFilter,
  ) => Promise<Blob>;
  fetchPurchaserPaymentsReport: (
    startDate?: Date,
    endDate?: Date,
    priceFilter?: PurchasePriceFilter,
  ) => Promise<Blob>;
};
export const MarketplaceFiatServiceProviderContext =
  createContext<MarketplaceFiatServiceProviderContext | null>(null);

const MarketplaceFiatServiceProvider = ({
  children,
}: MarketplaceFiatServiceProvider): React.JSX.Element => {
  const queryClient = useQueryClient();

  const mapPurchaseToReportFilter = useCallback(
    (filter?: PurchasePriceFilter): MarketplaceFiatServiceModelsPriceFilter | undefined => {
      if (filter === undefined) return undefined;
      switch (filter) {
        case PurchasePriceFilter.Invalid:
          return MarketplaceFiatServiceModelsPriceFilter.Invalid;
        case PurchasePriceFilter.All:
          return MarketplaceFiatServiceModelsPriceFilter.All;
        case PurchasePriceFilter.FreeOnly:
          return MarketplaceFiatServiceModelsPriceFilter.FreeOnly;
        case PurchasePriceFilter.PaidOnly:
          return MarketplaceFiatServiceModelsPriceFilter.PaidOnly;
        default:
          return undefined;
      }
    },
    [],
  );

  const [fiatBasePriceMap, setFiatBasePriceMap] = useState<Map<ProductType, BasePriceMapping[]>>();

  const fetchBasePrices = useCallback(
    async (productType: ProductType) => {
      if (fiatBasePriceMap && fiatBasePriceMap.has(productType)) {
        const fiatBasePriceList = fiatBasePriceMap.get(productType) as BasePriceMapping[];
        return fiatBasePriceList.slice();
      }
      const result = await marketplaceFiatService.getPrices(productType);
      const newMap = new Map(fiatBasePriceMap);
      newMap.set(productType, result);
      setFiatBasePriceMap(newMap);
      return result;
    },
    [fiatBasePriceMap],
  );

  const fetchProduct = useCallback(async (assetId: string, productType: ProductType) => {
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
  }, []);

  const configureProduct = useCallback(
    async (creatorStoreProductConfiguration: CreatorStoreProductConfiguration) => {
      const result = await openCloudCreatorStoreProduct.configureProduct(
        creatorStoreProductConfiguration.assetId,
        creatorStoreProductConfiguration.published,
        creatorStoreProductConfiguration.productType,
        creatorStoreProductConfiguration.basePrice,
      );

      queryClient.setQueryData(
        getFetchCreatorStoreProductKey(
          creatorStoreProductConfiguration.assetId,
          creatorStoreProductConfiguration.productType,
        ),
        result,
      );

      return result;
    },
    [queryClient],
  );

  const fetchSellerPaymentsReport = useCallback(
    async (startDate?: Date, endDate?: Date, priceFilter?: PurchasePriceFilter) => {
      try {
        const result = await marketplaceFiatService.getSellerPaymentsReport(
          startDate,
          endDate,
          mapPurchaseToReportFilter(priceFilter),
        );
        return result;
      } catch {
        throw new Error();
      }
    },
    [mapPurchaseToReportFilter],
  );

  const fetchPurchaserPaymentsReport = useCallback(
    async (startDate?: Date, endDate?: Date, priceFilter?: PurchasePriceFilter) => {
      const result = await marketplaceFiatService.getPurchaserPaymentsReport(
        startDate,
        endDate,
        mapPurchaseToReportFilter(priceFilter),
      );
      return result;
    },
    [mapPurchaseToReportFilter],
  );

  const value = useMemo(() => {
    return {
      configureProduct,
      fetchBasePrices,
      fetchProduct,
      fetchPurchaserPaymentsReport,
      fetchSellerPaymentsReport,
    };
  }, [
    configureProduct,
    fetchBasePrices,
    fetchProduct,
    fetchPurchaserPaymentsReport,
    fetchSellerPaymentsReport,
  ]);

  return (
    <MarketplaceFiatServiceProviderContext.Provider value={value}>
      {children}
    </MarketplaceFiatServiceProviderContext.Provider>
  );
};

export const assetToProduct = (assetType: Asset): ProductType => {
  switch (assetType) {
    case Asset.Audio:
      return ProductType.Audio;
    case Asset.Decal:
      return ProductType.Decal;
    case Asset.MeshPart:
      return ProductType.MeshPart;
    case Asset.Model:
      return ProductType.Model;
    case Asset.Plugin:
      return ProductType.Plugin;
    case Asset.Video:
      return ProductType.Video;
    default:
      return ProductType.Invalid;
  }
};

export default MarketplaceFiatServiceProvider;

export function useMarketplaceFiatServiceProvider(): MarketplaceFiatServiceProviderContext {
  const context = useContext(MarketplaceFiatServiceProviderContext);
  if (context === null) {
    throw new Error(
      'useMarketplaceFiatServiceProvider must be used within a MarketplaceFiatServiceProvider',
    );
  }
  return context;
}

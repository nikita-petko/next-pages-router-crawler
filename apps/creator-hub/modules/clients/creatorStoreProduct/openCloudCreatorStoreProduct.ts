import {
  RobloxMarketplaceFiatSharedV1Beta1ProductType as ProductType,
  RobloxPaymentsSharedV1ProductNamespace as ProductNamespace,
} from '@rbx/client-marketplace-fiat-service/v1';
import type { V2CloudProtos, v2Protos } from '@rbx/open-cloud';
import { V2CloudClient } from '@rbx/open-cloud';
import { getBEDEV2ServiceBasePath } from '../utils';

export type CreatorStoreProduct = V2CloudProtos.ICreatorStoreProduct;
export type Money = v2Protos.aep.type.IMoney;
export type CreatorStoreProductRestriction = V2CloudProtos.CreatorStoreProduct.Restriction;

const createCreatorStoreProductPath = (assetId: string, productType: ProductType) => {
  return `${ProductNamespace.CreatorMarketplaceAsset}-${productType}-${assetId}`;
};

class OpenCloudCreatorStoreProductClient {
  private cloudClient: V2CloudClient;

  constructor(basePath = getBEDEV2ServiceBasePath('user/cloud')) {
    this.cloudClient = new V2CloudClient({
      servicePath: basePath,
    });
  }

  async configureProduct(
    assetId: string,
    published: boolean,
    productType: ProductType,
    basePrice?: Money,
  ): Promise<CreatorStoreProduct> {
    let partialCreatorStoreProductWithAssetId: Pick<
      CreatorStoreProduct,
      | 'modelAssetId'
      | 'pluginAssetId'
      | 'decalAssetId'
      | 'meshPartAssetId'
      | 'audioAssetId'
      | 'videoAssetId'
    >;
    switch (productType) {
      case ProductType.Audio:
        partialCreatorStoreProductWithAssetId = { audioAssetId: assetId };
        break;
      case ProductType.Decal:
        partialCreatorStoreProductWithAssetId = { decalAssetId: assetId };
        break;
      case ProductType.MeshPart:
        partialCreatorStoreProductWithAssetId = { meshPartAssetId: assetId };
        break;
      case ProductType.Model:
        partialCreatorStoreProductWithAssetId = { modelAssetId: assetId };
        break;
      case ProductType.Plugin:
        partialCreatorStoreProductWithAssetId = { pluginAssetId: assetId };
        break;
      case ProductType.Video:
        partialCreatorStoreProductWithAssetId = { videoAssetId: assetId };
        break;
      default:
        throw new Error(
          `ProductType ${productType} for assetId: ${assetId} is not a valid fiat ProductType`,
        );
    }
    const fiatProductKey = createCreatorStoreProductPath(assetId, productType);
    const path = this.cloudClient.creatorStoreProductPath(fiatProductKey);
    const creatorStoreProduct: CreatorStoreProduct = {
      ...partialCreatorStoreProductWithAssetId,
      basePrice,
      published,
      path,
    };
    const request: V2CloudProtos.IUpdateCreatorStoreProductRequest = {
      allowMissing: true,
      creatorStoreProduct,
    };
    const [updatedCreatorStoreProduct] = await this.cloudClient.updateCreatorStoreProduct(request);
    // This is a workaround due to weird behavior where it's interpreting significand as a string
    // We need to interpret it as a number to match the BasePriceMapping type from MarketplaceFiatService (non-opencloud)
    if (updatedCreatorStoreProduct?.basePrice?.quantity?.significand) {
      updatedCreatorStoreProduct.basePrice.quantity.significand = Number(
        updatedCreatorStoreProduct.basePrice.quantity.significand,
      );
    }
    return updatedCreatorStoreProduct;
  }

  async getProduct(assetId: string, productType: ProductType): Promise<CreatorStoreProduct> {
    const fiatProductKey = createCreatorStoreProductPath(assetId, productType);
    const path = this.cloudClient.creatorStoreProductPath(fiatProductKey);
    const request: V2CloudProtos.IGetCreatorStoreProductRequest = {
      path,
    };
    const [fetchedCreatorStoreProduct] = await this.cloudClient.getCreatorStoreProduct(request);
    // This is a workaround due to weird behavior where it's interpreting significand as a string
    // We need to interpret it as a number to match the BasePriceMapping type from MarketplaceFiatService (non-opencloud)
    if (fetchedCreatorStoreProduct?.basePrice?.quantity?.significand) {
      fetchedCreatorStoreProduct.basePrice.quantity.significand = Number(
        fetchedCreatorStoreProduct.basePrice.quantity.significand,
      );
    }
    if (fetchedCreatorStoreProduct?.purchasePrice?.quantity?.significand) {
      fetchedCreatorStoreProduct.purchasePrice.quantity.significand = Number(
        fetchedCreatorStoreProduct.purchasePrice.quantity.significand,
      );
    }
    return fetchedCreatorStoreProduct;
  }
}

const openCloudCreatorStoreProductClient = new OpenCloudCreatorStoreProductClient();
export default openCloudCreatorStoreProductClient;

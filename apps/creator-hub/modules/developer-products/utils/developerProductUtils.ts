import type { DeveloperProductConfigV2 } from '@rbx/clients/developerProductsApi';
import type { DeveloperProductConfig } from '../types';

export function isSelectableForRegionalPricing(product: DeveloperProductConfigV2): boolean {
  return (
    product.isForSale &&
    product.priceInformation?.defaultPriceInRobux !== null &&
    !product.priceInformation?.enabledFeatures?.includes('PriceOptimization') &&
    !product.isImmutable
  );
}

export function hasRegionalPricingEnabled(product: DeveloperProductConfigV2): boolean {
  return product.priceInformation?.enabledFeatures?.includes('RegionalPricing') ?? false;
}

export function parseDeveloperProductConfig(
  developerProduct: DeveloperProductConfigV2,
): Readonly<DeveloperProductConfig> {
  return {
    productId: developerProduct.productId,
    name: developerProduct.name,
    description: developerProduct.description,
    iconImageAssetId: developerProduct.iconImageAssetId ?? 0,
    isForSale: developerProduct.isForSale,
    defaultPriceInRobux: developerProduct.priceInformation?.defaultPriceInRobux ?? null,
    isStorePageEnabled: developerProduct.storePageEnabled,
    isInActivePriceOptimizationExperiment:
      developerProduct.priceInformation?.enabledFeatures?.includes('PriceOptimization') ?? false,
    isRegionalPricingEnabled:
      developerProduct.priceInformation?.enabledFeatures?.includes('RegionalPricing') ?? false,
    isImmutable: developerProduct.isImmutable,
    updatedTimestamp: developerProduct.updatedTimestamp,

    // Derived properties
    isSelectableForRegionalPricing: isSelectableForRegionalPricing(developerProduct),
  } as const satisfies DeveloperProductConfig;
}

export function parseDeveloperProductConfigs(
  developerProducts?: DeveloperProductConfigV2[],
): Readonly<DeveloperProductConfig>[] {
  return developerProducts?.map((dp) => parseDeveloperProductConfig(dp)) ?? [];
}

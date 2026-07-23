import type { DeveloperProductConfigV2 } from '@rbx/client-developer-products-api/v1';
import type { DeveloperProductConfig } from '../types';

export function isSelectableForRegionalPricing(product: DeveloperProductConfigV2): boolean {
  return (
    product.isForSale &&
    product.priceInformation?.defaultPriceInRobux !== null &&
    !product.priceInformation?.enabledFeatures?.includes('PriceOptimization') &&
    !product.isImmutable
  );
}

export function isSelectableForManagedPricing(product: DeveloperProductConfigV2): boolean {
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

export function hasManagedPricingEnabled(product: DeveloperProductConfigV2): boolean {
  return product.isManagedPricingEnabled ?? false;
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
    isInActivePriceOptimizationExperiment:
      developerProduct.priceInformation?.enabledFeatures?.includes('PriceOptimization') ?? false,
    isRegionalPricingEnabled:
      developerProduct.priceInformation?.enabledFeatures?.includes('RegionalPricing') ?? false,
    isImmutable: developerProduct.isImmutable,
    updatedTimestamp: developerProduct.updatedTimestamp,
    isManagedPricingEnabled: developerProduct.isManagedPricingEnabled ?? false,

    // Derived properties
    isSelectableForRegionalPricing: isSelectableForRegionalPricing(developerProduct),
    isSelectableForManagedPricing: isSelectableForManagedPricing(developerProduct),
  } as const satisfies DeveloperProductConfig;
}

export function parseDeveloperProductConfigs(
  developerProducts?: DeveloperProductConfigV2[],
): Readonly<DeveloperProductConfig>[] {
  return developerProducts?.map((dp) => parseDeveloperProductConfig(dp)) ?? [];
}

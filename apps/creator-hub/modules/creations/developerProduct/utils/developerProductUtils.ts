import type { DeveloperProductConfigV2 } from '@rbx/client-developer-products-api/v1';
import type { DeveloperProduct } from '../types';

export function parseDeveloperProductConfig(
  developerProductConfig: DeveloperProductConfigV2,
): DeveloperProduct {
  return {
    productId: developerProductConfig.productId,
    name: developerProductConfig.name,
    description: developerProductConfig.description,
    iconImageAssetId: developerProductConfig.iconImageAssetId ?? 0,
    isForSale: developerProductConfig.isForSale,
    defaultPriceInRobux: developerProductConfig.priceInformation?.defaultPriceInRobux ?? null,
    isInActivePriceOptimizationExperiment:
      developerProductConfig.priceInformation?.enabledFeatures?.includes('PriceOptimization') ??
      false,
    isRegionalPricingEnabled:
      developerProductConfig.priceInformation?.enabledFeatures?.includes('RegionalPricing') ??
      false,
    isImmutable: developerProductConfig.isImmutable,
  } satisfies DeveloperProduct;
}

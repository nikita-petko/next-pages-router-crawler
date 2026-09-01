import type { DeveloperProductConfigV2 } from '@rbx/client-developer-products-api/v1';
import type { DeveloperProduct } from '../types';

/**
 * Archiving and unarchiving are the same write, and the API refuses both for the two states it
 * refuses every update for: immutable products, and products in a live price experiment.
 */
export const canToggleArchived = (product: DeveloperProduct): boolean =>
  !product.isImmutable && !product.isInActivePriceOptimizationExperiment;

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
    isArchived: developerProductConfig.isArchived ?? false,
  } satisfies DeveloperProduct;
}

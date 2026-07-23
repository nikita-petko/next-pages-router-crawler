import type { DeveloperProductConfigV2 } from '@modules/clients/developerProducts';
import type { GamePassConfigV2 } from '@modules/clients/passes';
import type { ManagedProduct } from '../../types';

export function isEligibleForManagedPricing(product: {
  isForSale: boolean;
  isImmutable?: boolean;
}) {
  return product.isForSale && !(product.isImmutable ?? false);
}

export function isManagedPricingEnabled(product: GamePassConfigV2 | DeveloperProductConfigV2) {
  return (product.isManagedPricingEnabled ?? false) && isEligibleForManagedPricing(product);
}

export function isInActivePriceOptimizationExperiment(
  product: GamePassConfigV2 | DeveloperProductConfigV2,
) {
  return product.priceInformation?.enabledFeatures?.includes('PriceOptimization') ?? false;
}

export function transformDeveloperProduct(product: DeveloperProductConfigV2): ManagedProduct {
  return {
    id: product.productId,
    name: product.name,
    imageAssetId: product.iconImageAssetId ?? 0,
    type: 'DeveloperProduct',
    defaultPriceInRobux: product.priceInformation?.defaultPriceInRobux ?? 0,
    isManagedPricingEnabled: isManagedPricingEnabled(product),
    isInActivePriceOptimizationExperiment: isInActivePriceOptimizationExperiment(product),
    updatedTimestamp: product.updatedTimestamp,
  };
}

export function transformGamePass(gamePass: GamePassConfigV2): ManagedProduct {
  return {
    id: gamePass.gamePassId,
    name: gamePass.name,
    imageAssetId: gamePass.iconAssetId,
    type: 'GamePass',
    defaultPriceInRobux: gamePass.priceInformation?.defaultPriceInRobux ?? 0,
    isManagedPricingEnabled: isManagedPricingEnabled(gamePass),
    isInActivePriceOptimizationExperiment: isInActivePriceOptimizationExperiment(gamePass),
    updatedTimestamp: gamePass.updatedTimestamp,
  };
}

export function transformDeveloperProducts(products: DeveloperProductConfigV2[]): ManagedProduct[] {
  return products.filter((p) => isEligibleForManagedPricing(p)).map(transformDeveloperProduct);
}

export function transformGamePasses(passes: GamePassConfigV2[]): ManagedProduct[] {
  return passes.filter((p) => isEligibleForManagedPricing(p)).map(transformGamePass);
}

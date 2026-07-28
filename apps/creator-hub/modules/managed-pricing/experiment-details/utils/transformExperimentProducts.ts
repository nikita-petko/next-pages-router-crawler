import type { ExperimentProductDetail } from '@rbx/client-price-experimentation-api/v1';
import type { ManagedProduct, ExperimentProduct } from '../../types';

/**
 * Transforms a ManagedProduct to an ExperimentProduct.
 * Only used for upcoming experiments, where we don't have experiment products.
 */
export function transformManagedProductToExperimentProduct(
  product: ManagedProduct,
): ExperimentProduct {
  return {
    id: product.id.toString(),
    type: product.type,
    name: product.name,
    imageAssetId: product.imageAssetId,
    isManagedPricingEnabled: product.isManagedPricingEnabled,
    originalPriceInRobux: product.defaultPriceInRobux,
  };
}

/**
 * Transforms an ExperimentProductDetail to an ExperimentProduct.
 * Used for non-upcoming experiments, where we have experiment products.
 */
export function transformExperimentResultToExperimentProduct(
  product: ExperimentProductDetail,
): ExperimentProduct {
  return {
    id: product.productIdentifier,
    type: product.productType === 'DeveloperProduct' ? 'DeveloperProduct' : 'GamePass',
    name: product.productName,
    imageAssetId: product.iconAssetId ?? 0,
    isManagedPricingEnabled: true,
    originalPriceInRobux: product.originalPriceInRobux,
    optimizedPriceInRobux: product.newPriceInRobux ?? undefined,
    optimizationPercentage: product.priceChangePercent ?? undefined,
  };
}

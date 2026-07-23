import type { Product } from '../types/product';

/**
 * Calculate item-level price change counts in a single pass
 * @param products - Array of products to analyze
 * @returns Object containing counts for price increases, decreases, and no changes
 */
export const calculatePriceChangeCounts = (products: Product[]) => {
  let increaseCount = 0;
  let decreaseCount = 0;
  let unchangedCount = 0;

  for (const product of products) {
    const { recommendedPriceInRobux, defaultPriceInRobux } = product;

    if (recommendedPriceInRobux == null || recommendedPriceInRobux === defaultPriceInRobux) {
      unchangedCount += 1;
    } else if (recommendedPriceInRobux > defaultPriceInRobux) {
      increaseCount += 1;
    } else {
      decreaseCount += 1;
    }
  }

  return {
    priceIncreaseCount: increaseCount,
    priceDecreaseCount: decreaseCount,
    noChangeCount: unchangedCount,
  } as const;
};

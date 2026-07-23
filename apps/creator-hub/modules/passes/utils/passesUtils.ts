import type { GamePassConfigV2 } from '@rbx/clients/gamePassesHttpService/v1';
import { GamePass } from '../types';

export const isPassEligibleForRegionalPricing = (pass: GamePass): boolean =>
  pass.isForSale &&
  !pass.isInActivePriceOptimizationExperiment &&
  pass.defaultPriceInRobux !== null;

export function hasRegionalPricingEnabled(pass: GamePassConfigV2): boolean {
  return pass.priceInformation?.enabledFeatures?.includes('RegionalPricing') ?? false;
}

export function transformGamePassesForTable(passes: GamePassConfigV2[]): GamePass[] {
  return passes
    .map((gamePass) => ({
      name: gamePass.name,
      passId: gamePass.gamePassId,
      thumbnailId: gamePass.iconAssetId,
      defaultPriceInRobux: gamePass.priceInformation?.defaultPriceInRobux || null,
      isRegionalPricingEnabled:
        gamePass.priceInformation?.enabledFeatures.includes('RegionalPricing') ?? false,
      isForSale: gamePass.isForSale,
      isInActivePriceOptimizationExperiment:
        gamePass.priceInformation?.enabledFeatures.includes('PriceOptimization') ?? false,
    }))
    .sort((a, b) => {
      // First sort by regional pricing eligibility
      const aEligible = isPassEligibleForRegionalPricing(a);
      const bEligible = isPassEligibleForRegionalPricing(b);
      if (aEligible !== bEligible) {
        return aEligible ? -1 : 1;
      }
      // Then sort by sale status
      if (a.isForSale !== b.isForSale) {
        return a.isForSale ? -1 : 1;
      }
      return 0;
    });
}

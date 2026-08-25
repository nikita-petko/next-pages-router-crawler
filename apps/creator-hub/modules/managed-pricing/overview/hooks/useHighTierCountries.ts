import { useGetRegionalPricingPreview } from '@modules/regional-pricing/queries/useGetRegionalPricingPreview';

// High tier countries are those who don't have a price discount applied due to regional pricing.
// By querying the regional pricing preview with a very high price,
// we can identify which countries are high tier as they will be the ones that still have that high price in the preview response.
const HIGH_TIER_PRICE = 1000;

type UseHighTierCountriesParams = {
  universeId: number;
};

export function useHighTierCountries({ universeId }: UseHighTierCountriesParams) {
  return useGetRegionalPricingPreview(
    { universeId, productType: 'GamePass', price: HIGH_TIER_PRICE },
    {
      select: (regionalPrices) =>
        new Set(
          regionalPrices.filter((r) => r.price === HIGH_TIER_PRICE).map((r) => r.countryCode),
        ),
    },
  );
}

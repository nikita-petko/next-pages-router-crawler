import { useGetShopFeatureEligibility } from '../queries/useGetShopFeatureEligibility';

export function useHasExternallyIneligibleShopItems(): boolean {
  // Temporary gate until item-level external eligibility is available.
  const { data: hasExternallyIneligibleShopItems = false } = useGetShopFeatureEligibility({
    select: ({ isProcessReceiptEnabled }) => isProcessReceiptEnabled === true,
  });

  return hasExternallyIneligibleShopItems;
}

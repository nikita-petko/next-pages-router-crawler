import type { GamePassConfigV2 } from '@modules/clients/passes';
import { useCountDeveloperProducts } from '@modules/developer-products/hooks/useCountDeveloperProducts';
import { useLoadInitialDeveloperProducts } from '@modules/developer-products/hooks/useLoadInitialDeveloperProducts';
import type { ListDeveloperProductsConfigsResponse } from '@modules/developer-products/queries/useInfiniteListDeveloperProducts';
import { useListAllPassesForUniverse } from '@modules/passes/queries/useListAllPassesForUniverse';
import {
  isEligibleForManagedPricing,
  isManagedPricingEnabled,
} from '../../manage-items/utils/transformManagedProducts';
import { useGetManagedPricingSummary } from '../../queries/useGetManagedPricingSummary';

function getPassProductCounts(passes: GamePassConfigV2[]) {
  return passes.reduce(
    (acc, pass) => {
      acc.eligiblePassCount += isEligibleForManagedPricing(pass) ? 1 : 0;
      acc.managedPassCount += isManagedPricingEnabled(pass) ? 1 : 0;
      return acc;
    },
    { eligiblePassCount: 0, managedPassCount: 0 },
  );
}

function getEligibleDeveloperProductCount(page: ListDeveloperProductsConfigsResponse) {
  return page.developerProducts.reduce(
    (acc, p) => acc + (isEligibleForManagedPricing(p) ? 1 : 0),
    0,
  );
}

function getManagedDeveloperProductCount(page: ListDeveloperProductsConfigsResponse) {
  return page.developerProducts.reduce((acc, p) => acc + (isManagedPricingEnabled(p) ? 1 : 0), 0);
}

// Only fetch first X products for overview cards
const INITIAL_FETCH_TOTAL = 1500;

export function useProductCountSummary(
  universeId: number,
  initialTotal: number = INITIAL_FETCH_TOTAL,
) {
  // Trigger initial fetch of developer products
  const {
    hitInitialTotal: hitInitialTotalDevProducts,
    isInitialLoading: isInitialLoadingDevProducts,
    isInitialError: isInitialErrorDevProducts,
  } = useLoadInitialDeveloperProducts({
    universeId,
    initialTotal,
  });

  // Try to determine total count first by fetching products directly
  const { data: eligibleDevProductCount, isError: isErrorEligibleDevProducts } =
    useCountDeveloperProducts({
      universeId,
      shouldShortCircuit: (acc) => acc >= initialTotal,
      getPageCount: getEligibleDeveloperProductCount,
    });

  const { data: managedDevProductCount, isError: isErrorManagedDevProducts } =
    useCountDeveloperProducts({
      universeId,
      shouldShortCircuit: (acc) => acc >= initialTotal,
      getPageCount: getManagedDeveloperProductCount,
    });

  const {
    data: { eligiblePassCount, managedPassCount } = {
      eligiblePassCount: undefined,
      managedPassCount: undefined,
    },
    isLoading: isLoadingPasses,
    isError: isErrorPasses,
  } = useListAllPassesForUniverse(universeId, {
    select: getPassProductCounts,
  });

  const {
    data: summary,
    isLoading: isLoadingSummary,
    isError: isErrorSummary,
  } = useGetManagedPricingSummary(universeId);

  const isLoadingDirectProductCount = isInitialLoadingDevProducts || isLoadingPasses;

  const isErrorDirectProductCount =
    isErrorEligibleDevProducts ||
    isErrorManagedDevProducts ||
    isInitialErrorDevProducts ||
    isErrorPasses;

  // If fetching products directly fails or has too many products, fallback to summary
  const shouldUseSummaryCount =
    isErrorDirectProductCount || (!isLoadingDirectProductCount && hitInitialTotalDevProducts);

  const isLoadingCount = shouldUseSummaryCount ? isLoadingSummary : isLoadingDirectProductCount;
  const isErrorCount = shouldUseSummaryCount ? isErrorSummary : isErrorDirectProductCount;

  const localEligibleCount =
    !isLoadingDirectProductCount &&
    eligibleDevProductCount !== undefined &&
    eligiblePassCount !== undefined
      ? eligibleDevProductCount + eligiblePassCount
      : undefined;

  const localManagedCount =
    !isLoadingDirectProductCount &&
    managedDevProductCount !== undefined &&
    managedPassCount !== undefined
      ? managedDevProductCount + managedPassCount
      : undefined;

  // Technically this result can be innacurate since the requirement to be managed pricing eligible
  // is to be on sale AND not immutable.
  // TODO: Revisit eligibility criteria and update this calculation if needed.
  const summaryEligibleCount = summary?.productCounts?.isForSale;
  const summaryManagedCount = summary?.productCounts?.isManaged;

  const totalEligibleCount = shouldUseSummaryCount ? summaryEligibleCount : localEligibleCount;
  const managedCount = shouldUseSummaryCount ? summaryManagedCount : localManagedCount;

  const hasEligibleProducts =
    (summaryEligibleCount !== undefined && summaryEligibleCount > 0) ||
    (localEligibleCount !== undefined && localEligibleCount > 0);

  return {
    totalEligibleCount,
    managedCount,
    hasEligibleProducts,
    isLoading: isLoadingCount,
    isError: isErrorCount,
    isLocalError: isErrorDirectProductCount,
  } as const;
}

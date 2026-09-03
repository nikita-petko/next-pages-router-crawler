import { useMonetizationFlags } from '@modules/monetization-shared/flags/useMonetizationFlags';
import { useShopItems } from '../item-catalog/hooks/useShopItems';
import { MOCK_SHOP_ITEMS } from '../mocks';
import { isListedButExternallyIneligible, type ShopItem } from '../types';
import { usePersonalizedShop } from './usePersonalizedShop';

type UseExternallyIneligibleShopItemsReturn = {
  /** Listed items that cannot surface out of experience. */
  items: ShopItem[];
  /** True when at least one item needs an external eligibility fix. Gates the report surfaces. */
  hasIneligibleItems: boolean;
  /** True until 1,000 report items are ready or the whole catalog is cached. */
  isLoading: boolean;
  isAllItemsLoaded: boolean;
  isError: boolean;
};

const INITIAL_REPORT_ITEM_COUNT = 1000;
const MOCK_INELIGIBLE_ITEMS = MOCK_SHOP_ITEMS.filter(isListedButExternallyIneligible);

/**
 * Listed-but-externally-ineligible items in a universe's personalized shop — the
 * External eligibility report set behind the developer products warning banner and report page.
 *
 * Serves {@link MOCK_SHOP_ITEMS} while `mockShopItemsExternalEligibility` is on, since
 * shops-api does not send `isExternallyEligible` yet and every real item therefore
 * resolves as eligible.
 */
export function useExternallyIneligibleShopItems(
  universeId: number | undefined,
): UseExternallyIneligibleShopItemsReturn {
  const { mockShopItemsExternalEligibility, ready: isFlagReady } = useMonetizationFlags(
    'mockShopItemsExternalEligibility',
  );
  const isMocked = !!mockShopItemsExternalEligibility;

  const { data: shop, isLoading: isLoadingShop } = usePersonalizedShop(universeId, {
    enabled: !isMocked,
  });
  const {
    items: ineligibleItems,
    isAllItemsLoaded,
    isError,
  } = useShopItems({
    shopId: shop?.shopId,
    filter: isListedButExternallyIneligible,
    enabled: !isMocked,
  });

  const reportItems = isMocked ? MOCK_INELIGIBLE_ITEMS : ineligibleItems;
  const hasLoadedInitialReportItems =
    reportItems.length >= INITIAL_REPORT_ITEM_COUNT || isAllItemsLoaded;
  const isCatalogFullyLoaded = isFlagReady && (isMocked || (!isLoadingShop && isAllItemsLoaded));

  return {
    items: reportItems,
    hasIneligibleItems: reportItems.length > 0,
    isLoading: !isFlagReady || (!isMocked && (isLoadingShop || !hasLoadedInitialReportItems)),
    isAllItemsLoaded: isCatalogFullyLoaded,
    isError: !isMocked && isError,
  };
}

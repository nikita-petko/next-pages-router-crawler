import { useMemo } from 'react';
import { useMonetizationFlags } from '@modules/monetization-shared/flags/useMonetizationFlags';
import { useShopItems } from '../item-catalog/hooks/useShopItems';
import { MOCK_SHOP_ITEMS } from '../mocks';
import { isListedButExternallyIneligible, type ShopItem } from '../types';
import { usePersonalizedShop } from './usePersonalizedShop';

type UseExternallyIneligibleShopItemsReturn = {
  /** Listed items that cannot surface out of experience. */
  items: ShopItem[];
  /** True when at least one item needs a ProcessReceipt fix. Gates the report surfaces. */
  hasIneligibleItems: boolean;
  /** Callers should hold off on empty states until the whole catalog is cached. */
  isLoading: boolean;
};

/**
 * Listed-but-externally-ineligible items in a universe's personalized shop — the
 * ProcessReceipt report set behind the dev products warning banner and report page.
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
  const { items, isAllItemsLoaded } = useShopItems({
    shopId: shop?.shopId,
    enabled: !isMocked,
  });

  const catalog = isMocked ? MOCK_SHOP_ITEMS : items;
  // Catalog spans every item in the shop, so filter once per change rather than on
  // every render of the consuming page.
  const ineligibleItems = useMemo(() => catalog.filter(isListedButExternallyIneligible), [catalog]);

  return {
    items: ineligibleItems,
    hasIneligibleItems: ineligibleItems.length > 0,
    isLoading: !isFlagReady || (!isMocked && (isLoadingShop || !isAllItemsLoaded)),
  };
}

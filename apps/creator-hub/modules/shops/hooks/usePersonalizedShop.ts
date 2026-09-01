import type { ListShopsByScopeResponse, ShopOverview } from '@rbx/client-shops-api/v1';
import { useListShopsByScope } from '../queries/useListShopsByScope';

// TODO(shops-api): switch to `data?.shops.find(s => s.type === 'PersonalizedShop')`
// when shops-api adds the shop-type discriminator; today shops[0] is the
// universe's single personalized shop.
export function selectPersonalizedShop(data?: ListShopsByScopeResponse): ShopOverview | undefined {
  return data?.shops.length ? data.shops[0] : undefined;
}

export function usePersonalizedShop(
  universeId: number | undefined,
  options?: { enabled?: boolean },
) {
  return useListShopsByScope(universeId, {
    select: selectPersonalizedShop,
    enabled: options?.enabled,
  });
}

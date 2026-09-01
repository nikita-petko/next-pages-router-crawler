import type { Category, GetShopConfigResponse } from '@rbx/client-shops-api/v1';
import { useGetCreatorShopConfig } from '../../queries/useGetCreatorShopConfig';

type UseAvailableCategoriesParams = {
  shopId: number | undefined;
};

type UseAvailableCategoriesReturn = {
  categories: Category[];
  isLoading: boolean;
};

const EMPTY_CATEGORIES: Category[] = [];

const selectCategories = (data: GetShopConfigResponse): Category[] =>
  data.categories ?? EMPTY_CATEGORIES;

/**
 * Reads a shop's category registry from the dedicated creator shop config
 * endpoint, narrowing the response to its `categories`.
 */
export function useAvailableCategories({
  shopId,
}: UseAvailableCategoriesParams): UseAvailableCategoriesReturn {
  const { data, isLoading } = useGetCreatorShopConfig(shopId, { select: selectCategories });

  return { categories: data ?? EMPTY_CATEGORIES, isLoading };
}

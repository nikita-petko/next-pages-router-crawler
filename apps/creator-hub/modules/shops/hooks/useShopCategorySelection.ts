import { useCallback } from 'react';
import type { Category } from '@rbx/client-shops-api/v1';
import { useTranslation } from '@rbx/intl';
import { MAX_SHOP_CATEGORIES } from '../constants';
import { isNewCategoryOverLimit } from '../utils/categorySelection';

type UseShopCategorySelectionReturn = {
  isAtCategoryLimit: boolean;
  /** Builds the limit hint for the current input, or undefined when valid. */
  getCategoryHint: (value: string) => string | undefined;
};

/**
 * Category-cap helpers for item-creation forms: whether the shop is at its
 * category limit, and the over-limit hint for a typed name.
 */
export function useShopCategorySelection(
  availableCategories: readonly Category[],
): UseShopCategorySelectionReturn {
  const { translate } = useTranslation();

  const isAtCategoryLimit = availableCategories.length >= MAX_SHOP_CATEGORIES;

  const getCategoryHint = useCallback(
    (value: string) =>
      isNewCategoryOverLimit(value, availableCategories)
        ? translate('Message.MaxCategoriesReached', { limit: MAX_SHOP_CATEGORIES.toString() })
        : undefined,
    [availableCategories, translate],
  );

  return { isAtCategoryLimit, getCategoryHint };
}

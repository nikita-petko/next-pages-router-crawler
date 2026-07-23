import { useState, useMemo, useCallback, useEffect } from 'react';
import type { DeveloperProductConfig } from '../types';

export type UseSelectEligibleDeveloperProductsParams = {
  /** All loaded developer products (flattened from infinite query) */
  allProducts: DeveloperProductConfig[];
  /** Current page of developer products displayed */
  currentPage: DeveloperProductConfig[];
  /**
   * Mode of bulk selection. Use one of the following:
   * - `all` to select all products across pages
   * - `page` to select all products on the single page
   */
  mode: 'all' | 'page';
  /** Limit for the number of selectable products */
  limit?: number;
  /** Disable override for selection */
  disabled?: boolean;
};

export type UseSelectEligibleDeveloperProductsReturn = {
  /** Map of selected products by product ID */
  selectedProducts: Map<number, DeveloperProductConfig>;
  /** Total number of selected products */
  numSelected: number;
  /** Total number of selectable products. Returns undefined if mode is 'page' or if products are not loaded  */
  numSelectable: number | undefined;
  /** Number of selected products on the current page */
  numSelectedOnPage: number;
  /** Number of selectable products on the current page */
  numSelectableOnPage: number;
  /** Whether the current selection is set to enabling */
  isEnabling: boolean;
  /** Whether checkboxes should be disabled entirely */
  isDisabled: boolean;
  /** Whether the selection has reached the specified limit */
  isLimitReached: boolean;
  /** Whether bulk selection is disabled due to no selectable products for mode */
  isBulkSelectionDisabled: boolean;
  /** Callback to check if a product is selectable for regional pricing */
  isSelectable: (product: DeveloperProductConfig) => boolean;
  /** Callback to toggle selection of a single product */
  toggleProductSelection: (product: DeveloperProductConfig, isChecked: boolean) => void;
  /** Callback to toggle selection of products via header checkbox */
  toggleBulkSelection: (isChecked: boolean) => void;
  /** Callback to reset all selections */
  resetSelection: () => void;
};

const isMismatch = (
  product: DeveloperProductConfig,
  selectedProduct: DeveloperProductConfig | undefined,
): boolean => {
  return (
    !!selectedProduct &&
    (product.isRegionalPricingEnabled !== selectedProduct.isRegionalPricingEnabled ||
      product.isSelectableForRegionalPricing !== selectedProduct.isSelectableForRegionalPricing)
  );
};

const isSelectable = (product: DeveloperProductConfig) => product.isSelectableForRegionalPricing;

/**
 * Hook for managing selection of developer products in a paginated table.
 */
export function useSelectEligibleDeveloperProducts({
  allProducts,
  currentPage,
  mode,
  limit = Infinity,
  disabled,
}: UseSelectEligibleDeveloperProductsParams): UseSelectEligibleDeveloperProductsReturn {
  const [selectedProducts, setSelectedProducts] = useState<Map<number, DeveloperProductConfig>>(
    new Map(),
  );

  const isLimitReached = selectedProducts.size >= limit;

  const selectableProductsOnPage = useMemo(() => currentPage.filter(isSelectable), [currentPage]);

  const selectedProductsOnPage = useMemo(() => {
    return selectableProductsOnPage.filter((product) => selectedProducts.has(product.productId));
  }, [selectableProductsOnPage, selectedProducts]);

  const hasSelectableProductsOnPage = selectableProductsOnPage.length > 0;

  // Only compute these when mode is 'all' to avoid unnecessary computation
  const numSelectable = useMemo<number | undefined>(
    () => (mode === 'all' ? allProducts.filter(isSelectable).length : undefined),
    [allProducts, mode],
  );

  const hasSelectableAllLoaded = numSelectable !== undefined && numSelectable > 0;

  // Default enable if at least one product is not regional pricing enabled
  // Really inefficient but we disable on a limit, so this is acceptable
  const isEnabling = useMemo(() => {
    return Array.from(selectedProducts.values()).some(
      (product) => !product.isRegionalPricingEnabled,
    );
  }, [selectedProducts]);

  const toggleProductSelection = useCallback(
    (product: DeveloperProductConfig, isChecked: boolean) => {
      if (!isSelectable(product)) {
        return;
      }

      setSelectedProducts((prevSelected) => {
        const newSelected = new Map(prevSelected);
        if (isChecked) {
          if (newSelected.size < limit) {
            newSelected.set(product.productId, product);
          }
        } else {
          newSelected.delete(product.productId);
        }
        return newSelected;
      });
    },
    [limit],
  );

  const togglePageSelection = useCallback(
    (isChecked: boolean) => {
      setSelectedProducts((prevSelected) => {
        const newSelected = new Map(prevSelected);
        if (isChecked) {
          selectableProductsOnPage.forEach((product) => {
            if (newSelected.size < limit) {
              newSelected.set(product.productId, product);
            }
          });
        } else {
          selectableProductsOnPage.forEach((product) => newSelected.delete(product.productId));
        }
        return newSelected;
      });
    },
    [limit, selectableProductsOnPage],
  );

  const toggleAllSelection = useCallback(
    (isChecked: boolean) => {
      setSelectedProducts((prevSelected) => {
        if (isChecked) {
          const newSelected = new Map(prevSelected);
          allProducts.forEach((product) => {
            if (isSelectable(product) && newSelected.size < limit) {
              newSelected.set(product.productId, product);
            }
          });
          return newSelected;
        }

        return new Map();
      });
    },
    [allProducts, limit],
  );

  const resetSelection = useCallback(() => {
    setSelectedProducts(new Map());
  }, []);

  // Whenever products are stale, find and deselect ineligible products to prevent invalid selections
  useEffect(() => {
    setSelectedProducts((prevSelected) => {
      const mismatches = currentPage.filter((product) =>
        isMismatch(product, prevSelected.get(product.productId)),
      );

      // If no mismatches, do not update state
      if (mismatches.length === 0) {
        return prevSelected;
      }

      const newSelected = new Map(prevSelected);
      mismatches.forEach((product) => {
        if (!isSelectable(product)) {
          newSelected.delete(product.productId);
        } else {
          newSelected.set(product.productId, product);
        }
      });
      return newSelected;
    });
  }, [currentPage]);

  const isBulkSelectionDisabled =
    (mode === 'page' && !hasSelectableProductsOnPage) ||
    (mode === 'all' && !hasSelectableAllLoaded);

  const toggleBulkSelection = mode === 'all' ? toggleAllSelection : togglePageSelection;

  return useMemo(
    () =>
      ({
        selectedProducts,
        numSelected: selectedProducts.size,
        numSelectable,
        numSelectedOnPage: selectedProductsOnPage.length,
        numSelectableOnPage: selectableProductsOnPage.length,
        isEnabling,
        isDisabled: !!disabled,
        isLimitReached,
        isBulkSelectionDisabled,
        isSelectable,
        toggleBulkSelection,
        toggleProductSelection,
        resetSelection,
      }) as const satisfies UseSelectEligibleDeveloperProductsReturn,
    [
      selectedProducts,
      numSelectable,
      selectedProductsOnPage.length,
      selectableProductsOnPage.length,
      isEnabling,
      disabled,
      isLimitReached,
      isBulkSelectionDisabled,
      toggleBulkSelection,
      toggleProductSelection,
      resetSelection,
    ],
  );
}

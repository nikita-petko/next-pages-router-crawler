import { useState, useMemo, useCallback, useEffect } from 'react';
import { isPassEligibleForRegionalPricing } from '../utils/passesUtils';
import type { GamePass } from '../types';

export type UseSelectEligiblePassesParams = {
  /** All passes loaded for the universe */
  items: GamePass[];
  /** Disable override for selection (e.g., during bulk updates) */
  disabled?: boolean;
};

export type UseSelectEligiblePassesReturn = {
  /** Map of selected passes by pass ID */
  selectedPasses: Map<number, GamePass>;
  /** Total number of selected passes */
  numSelected: number;
  /** Total number of selectable (eligible) passes */
  numSelectable: number;
  /** Whether the current selection is set to enabling */
  isEnabling: boolean;
  /** Whether checkboxes should be disabled entirely */
  isDisabled: boolean;
  /** Whether bulk selection is disabled due to no selectable passes */
  isBulkSelectionDisabled: boolean;
  /** Callback to check if a pass is selectable for regional pricing */
  isSelectable: (pass: GamePass) => boolean;
  /** Callback to toggle selection of a single pass */
  togglePassSelection: (pass: GamePass, isChecked: boolean) => void;
  /** Callback to toggle selection of all eligible passes via header checkbox */
  toggleBulkSelection: (isChecked: boolean) => void;
  /** Callback to reset all selections */
  resetSelection: () => void;
};

const isSelectable = (pass: GamePass): boolean => isPassEligibleForRegionalPricing(pass);

const isMismatch = (pass: GamePass, selectedPass: GamePass | undefined): boolean => {
  return (
    !!selectedPass &&
    (pass.isRegionalPricingEnabled !== selectedPass.isRegionalPricingEnabled ||
      isSelectable(pass) !== isSelectable(selectedPass))
  );
};

/**
 * Hook for managing selection of passes in a table. Simplified for client-side pagination.
 */
export function useSelectEligiblePasses({
  items,
  disabled = false,
}: UseSelectEligiblePassesParams): UseSelectEligiblePassesReturn {
  const [selectedPasses, setSelectedPasses] = useState<Map<number, GamePass>>(new Map());

  const selectableItems = useMemo(() => items.filter(isSelectable), [items]);

  const hasSelectableItems = selectableItems.length > 0;

  const isEnabling = useMemo(() => {
    return Array.from(selectedPasses.values()).some((pass) => !pass.isRegionalPricingEnabled);
  }, [selectedPasses]);

  const togglePassSelection = useCallback((pass: GamePass, isChecked: boolean) => {
    if (!isSelectable(pass)) {
      return;
    }

    setSelectedPasses((prev) => {
      const next = new Map(prev);
      if (isChecked) {
        next.set(pass.passId, pass);
      } else {
        next.delete(pass.passId);
      }
      return next;
    });
  }, []);

  const toggleBulkSelection = useCallback(
    (isChecked: boolean) => {
      if (isChecked) {
        setSelectedPasses(new Map(selectableItems.map((item) => [item.passId, item])));
      } else {
        setSelectedPasses(new Map());
      }
    },
    [selectableItems],
  );

  const resetSelection = useCallback(() => {
    setSelectedPasses(new Map());
  }, []);

  // Whenever passes are stale, reconcile selection to prevent invalid selections
  useEffect(() => {
    setSelectedPasses((prev) => {
      if (prev.size === 0) return prev;

      const mismatches = items.filter((pass) => isMismatch(pass, prev.get(pass.passId)));

      if (mismatches.length === 0) return prev;

      const next = new Map(prev);
      mismatches.forEach((pass) => {
        if (!isSelectable(pass)) {
          next.delete(pass.passId);
        }
      });
      return next;
    });
  }, [items]);

  return useMemo(
    () =>
      ({
        selectedPasses,
        numSelected: selectedPasses.size,
        numSelectable: selectableItems.length,
        isEnabling,
        isDisabled: disabled,
        isBulkSelectionDisabled: !hasSelectableItems,
        isSelectable,
        togglePassSelection,
        toggleBulkSelection,
        resetSelection,
      }) as const satisfies UseSelectEligiblePassesReturn,
    [
      selectedPasses,
      selectableItems.length,
      isEnabling,
      disabled,
      hasSelectableItems,
      togglePassSelection,
      toggleBulkSelection,
      resetSelection,
    ],
  );
}

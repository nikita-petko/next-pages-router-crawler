import { useCallback, useMemo, useState } from 'react';
import {
  PlayerFeedbackFilterDimension,
  PlayerFeedbackFilterState,
  DEFAULT_FILTER_STATE,
} from '../types/PlayerFeedbackFilters';

export interface UsePlayerFeedbackFiltersReturn {
  filterState: PlayerFeedbackFilterState;
  activeFilters: PlayerFeedbackFilterDimension[];
  hasActiveFilters: boolean;
  updateFilter: (
    dimension: PlayerFeedbackFilterDimension,
    values: string[] | boolean | null,
  ) => void;
  clearFilter: (dimension: PlayerFeedbackFilterDimension) => void;
  clearAllFilters: () => void;
  getFilterValues: (dimension: PlayerFeedbackFilterDimension) => string[] | boolean | null;
}

export const usePlayerFeedbackFilters = (): UsePlayerFeedbackFiltersReturn => {
  const [filterState, setFilterState] = useState<PlayerFeedbackFilterState>(DEFAULT_FILTER_STATE);

  const updateFilter = useCallback(
    (dimension: PlayerFeedbackFilterDimension, values: string[] | boolean | null) => {
      setFilterState((prev) => ({
        ...prev,
        [dimension]: values,
      }));
    },
    [],
  );

  const clearFilter = useCallback((dimension: PlayerFeedbackFilterDimension) => {
    setFilterState((prev) => ({
      ...prev,
      [dimension]: [],
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilterState(DEFAULT_FILTER_STATE);
  }, []);

  const getFilterValues = useCallback(
    (dimension: PlayerFeedbackFilterDimension) => {
      return filterState[dimension];
    },
    [filterState],
  );

  const activeFilters = useMemo(() => {
    return Object.entries(filterState).reduce<PlayerFeedbackFilterDimension[]>(
      (acc, [dimension, values]) => {
        if (Array.isArray(values) && values.length > 0) {
          acc.push(dimension as PlayerFeedbackFilterDimension);
        }
        return acc;
      },
      [],
    );
  }, [filterState]);

  const hasActiveFilters = useMemo(() => {
    return activeFilters.length > 0;
  }, [activeFilters]);

  return {
    filterState,
    activeFilters,
    hasActiveFilters,
    updateFilter,
    clearFilter,
    clearAllFilters,
    getFilterValues,
  };
};

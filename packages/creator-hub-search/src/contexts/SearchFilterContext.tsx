import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type FC,
  type PropsWithChildren,
} from 'react';
import { DocumentationContentType, SearchDisplayCategory } from '../clients/docSiteSearchType';
import { DocsSitePathPrefix } from '../utilities/utils/path';

/** Max results per category in All (default) state */
export const MAX_RESULTS_DEFAULT = 4;
/** Max results per subcategory in Learn + /docs context */
export const MAX_RESULTS_LEARN_DOCS = 3;

/**
 * Filter state and context detection for the search package.
 *
 * Manages:
 * - Display filter (Hub/Learn)
 * - Sub-filter (content type when in Learn + doc-site context)
 * - URL context detection (/docs vs other paths)
 * - Derived state for chip visibility and result limits
 */
export interface SearchFilterState {
  // Filter state
  displayFilter: SearchDisplayCategory;
  subFilter: DocumentationContentType;

  // URL context
  isDocSiteContext: boolean;

  // Actions
  setDisplayFilter: (filter: SearchDisplayCategory) => void;
  setSubFilter: (filter: DocumentationContentType) => void;
  clearFilters: () => void;
  /** Restore context-appropriate defaults (e.g. pre-select Learn on doc sites). */
  presetFilters: () => void;

  // Derived state for UI
  /**
   * Whether to show subcategory chips (Engine API, Cloud API, etc.)
   * True when: isDocSiteContext && displayFilter === Learn
   */
  shouldShowSubcategoryChips: boolean;

  /**
   * Whether to show any filter chips at the bottom.
   * - Default state: show Hub/Learn chips
   * - Hub selected: no chips
   * - Learn selected (non-docs): no chips
   * - Learn selected (docs): show subcategory chips
   * - Learn selected + Subcategory Selected: no chips
   */
  shouldShowFilterChips: boolean;

  /**
   * Whether the current filter is the default (no filter applied)
   */
  isFilterDefault: boolean;

  /**
   * Max results to display per category in grouped views.
   * - All (default): MAX_RESULTS_DEFAULT (4)
   * - Learn + /docs (subcategories): MAX_RESULTS_LEARN_DOCS (3)
   * - Otherwise: undefined (no limit, show all results)
   *
   * Note: Consumers should override to undefined when a specific
   * subcategory is selected (content type filter is active).
   */
  maxResultsPerCategory: number | undefined;
}

const defaultState: SearchFilterState = {
  displayFilter: SearchDisplayCategory.All,
  subFilter: DocumentationContentType.All,
  isDocSiteContext: false,
  setDisplayFilter: () => {},
  setSubFilter: () => {},
  clearFilters: () => {},
  presetFilters: () => {},
  shouldShowSubcategoryChips: false,
  shouldShowFilterChips: true,
  isFilterDefault: true,
  maxResultsPerCategory: MAX_RESULTS_DEFAULT,
};

const SearchFilterContext = createContext<SearchFilterState>(defaultState);
SearchFilterContext.displayName = 'SearchFilterContext';

export interface SearchFilterProviderProps {
  children: React.ReactNode;
}

/**
 * Provider for search filter state.
 *
 * Place this provider:
 * - Inside SearchDialogV2 if you want filters to reset when dialog closes
 * - Outside SearchDialogV2 if you want filters to persist across open/close
 *
 * @example
 * ```tsx
 * <SearchFilterProvider>
 *   <SearchDialogContent />
 * </SearchFilterProvider>
 * ```
 */
export const SearchFilterProvider: FC<PropsWithChildren<SearchFilterProviderProps>> = ({
  children,
}) => {
  // NOTE (@neoxu, 2026-02-06): Use window.location.pathname instead of Next.js usePathname()
  // because doc-site-ssr has basePath: '/docs', and usePathname() strips the basePath,
  // so it would never contain '/docs'. window.location.pathname includes the basePath.
  const isDocSiteContext =
    typeof window !== 'undefined' && window.location.pathname.startsWith(DocsSitePathPrefix);

  const defaultDisplayFilter = isDocSiteContext
    ? SearchDisplayCategory.Learn
    : SearchDisplayCategory.All;

  const [displayFilter, setDisplayFilterState] =
    useState<SearchDisplayCategory>(defaultDisplayFilter);
  const [subFilter, setSubFilterState] = useState<DocumentationContentType>(
    DocumentationContentType.All,
  );
  // On doc sites, Learn is pre-selected (drilled-in) when the dialog opens.
  const [isExplicitlyFiltered, setIsExplicitlyFiltered] = useState(isDocSiteContext);

  // Actions
  const setDisplayFilter = useCallback((filter: SearchDisplayCategory) => {
    setDisplayFilterState(filter);
    setIsExplicitlyFiltered(true);
    setSubFilterState(DocumentationContentType.All);
  }, []);

  const setSubFilter = useCallback((filter: DocumentationContentType) => {
    setSubFilterState(filter);
  }, []);

  const clearFilters = useCallback(() => {
    setDisplayFilterState(defaultDisplayFilter);
    setIsExplicitlyFiltered(false);
    setSubFilterState(DocumentationContentType.All);
  }, [defaultDisplayFilter]);

  const presetFilters = useCallback(() => {
    setDisplayFilterState(defaultDisplayFilter);
    setIsExplicitlyFiltered(isDocSiteContext);
    setSubFilterState(DocumentationContentType.All);
  }, [defaultDisplayFilter, isDocSiteContext]);

  // Derived state — uses explicit flag so that on doc sites (where default is Learn),
  // clicking the Learn category title still transitions from grouped to drilled-in view.
  const isFilterDefault = !isExplicitlyFiltered;

  const shouldShowSubcategoryChips =
    isDocSiteContext && displayFilter === SearchDisplayCategory.Learn;

  const shouldShowFilterChips = useMemo(() => {
    // Default state: show Hub/Learn chips
    if (isFilterDefault) {
      return true;
    }

    // Hub selected: no chips
    if (displayFilter === SearchDisplayCategory.Hub) {
      return false;
    }

    // Learn selected
    if (displayFilter === SearchDisplayCategory.Learn) {
      // In doc-site context: show subcategory chips
      if (isDocSiteContext) {
        return true;
      }
      // Non-doc-site context: no chips
      return false;
    }

    return false;
  }, [isFilterDefault, displayFilter, isDocSiteContext]);

  // Max results per category in grouped views.
  // Consumers should override to undefined when a subcategory is selected.
  const maxResultsPerCategory = useMemo<number | undefined>(() => {
    // All (default): 4 per display category (Hub/Learn)
    if (isFilterDefault) {
      return MAX_RESULTS_DEFAULT;
    }

    // Learn in /docs: 3 per subcategory
    if (displayFilter === SearchDisplayCategory.Learn && isDocSiteContext) {
      return MAX_RESULTS_LEARN_DOCS;
    }

    // Hub selected, Learn non-docs: no limit
    return undefined;
  }, [isFilterDefault, displayFilter, isDocSiteContext]);

  const value = useMemo<SearchFilterState>(
    () => ({
      displayFilter,
      subFilter,
      isDocSiteContext,
      setDisplayFilter,
      setSubFilter,
      clearFilters,
      presetFilters,
      shouldShowSubcategoryChips,
      shouldShowFilterChips,
      isFilterDefault,
      maxResultsPerCategory,
    }),
    [
      displayFilter,
      subFilter,
      isDocSiteContext,
      setDisplayFilter,
      setSubFilter,
      clearFilters,
      presetFilters,
      shouldShowSubcategoryChips,
      shouldShowFilterChips,
      isFilterDefault,
      maxResultsPerCategory,
    ],
  );

  return <SearchFilterContext.Provider value={value}>{children}</SearchFilterContext.Provider>;
};

/**
 * Hook to access search filter state.
 *
 * @returns The current search filter state and actions
 *
 * @example
 * ```tsx
 * const {
 *   displayFilter,
 *   setDisplayFilter,
 *   shouldShowFilterChips,
 * } = useSearchFilter();
 * ```
 */
export function useSearchFilter(): SearchFilterState {
  return useContext(SearchFilterContext);
}

export default SearchFilterContext;

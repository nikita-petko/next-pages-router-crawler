import { useMemo } from 'react';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import type { AvatarItemDropdown } from '../constants/avatarItemConstants';
import { isValidIndex } from '../utils/avatarMenuMapUtils';
import type { ProcessedCategory } from '../utils/taxonomyCategoriesUtils';
import {
  buildTaxonomyL2Options,
  categoryToDropdown,
  findL1Category,
} from '../utils/taxonomyCategoriesUtils';
import { isAllAssetTypesActiveTab, parseTaxonomyActiveTab } from '../utils/taxonomyRoutingUtils';
import useTaxonomyCategories from './useTaxonomyCategories';

export interface TaxonomySelectionState {
  /** Top-level categories, in the order the chip row renders them. */
  l1Options: AvatarItemDropdown[];
  /** Key of the active L1, or undefined on the folder-backed All Asset Types tab. */
  activeL1Key?: string;
  activeL1Node?: ProcessedCategory;
  /** Sub-categories of the active L1; empty when it is a leaf. */
  l2Options: AvatarItemDropdown[];
  /** Resolved sub-category index. Always addresses `l2Options`, never AvatarMenuMap. */
  filterIndex: number;
  /**
   * What the grid should filter by. Undefined while the tree loads, and for a category that is not
   * in the tree — showing a different category's items would misrepresent what the URL asked for, so
   * callers must wait rather than substitute something.
   */
  selection?: AvatarItemDropdown;
  isLoading: boolean;
}

/**
 * Single source of truth for which taxonomy category the Avatar Items page is showing.
 *
 * Selection lives entirely in `activeTab` + `filterIndex`, so every consumer that derives from those
 * params must agree on how to read them; owning that here keeps the chip row and the grid from
 * resolving the same URL to different categories.
 */
const useTaxonomySelection = (enabled: boolean): TaxonomySelectionState => {
  const [{ activeTab, filterIndex }] = useQueryParams(['activeTab', 'filterIndex']);
  const { l1Options, categories, isLoading } = useTaxonomyCategories(enabled);

  // All Asset Types sits in the taxonomy namespace but is not a category, so it has no active L1.
  const activeL1Key = isAllAssetTypesActiveTab(activeTab)
    ? undefined
    : (parseTaxonomyActiveTab(activeTab) ?? l1Options[0]?.taxonomyKey);

  const activeL1Node = useMemo(
    () => findL1Category(categories, activeL1Key),
    [categories, activeL1Key],
  );
  const l2Options = useMemo(() => buildTaxonomyL2Options(activeL1Node), [activeL1Node]);

  const parsedIndex = parseInt(filterIndex?.toString() ?? '', 10);
  const resolvedFilterIndex = isValidIndex(parsedIndex, l2Options) ? parsedIndex : 0;

  const selection = useMemo((): AvatarItemDropdown | undefined => {
    if (!activeL1Node) {
      return undefined;
    }
    // `filterIndex` addresses the sub-selector, so an L1 with children filters by the selected
    // child. A leaf L1 (Backgrounds) has no sub-selector and filters by itself.
    if (l2Options.length > 0) {
      return l2Options[resolvedFilterIndex];
    }
    return activeL1Node.webStableId ? categoryToDropdown(activeL1Node) : undefined;
  }, [activeL1Node, l2Options, resolvedFilterIndex]);

  return {
    l1Options,
    activeL1Key,
    activeL1Node,
    l2Options,
    filterIndex: resolvedFilterIndex,
    selection,
    isLoading,
  };
};

export default useTaxonomySelection;

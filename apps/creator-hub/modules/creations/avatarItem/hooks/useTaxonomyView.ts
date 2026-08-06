import type { Asset } from '@modules/miscellaneous/common';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import useTaxonomyDashboardGate from '../../home/hooks/useTaxonomyDashboardGate';
import {
  isAllAssetTypesActiveTab,
  isAvatarLooksActiveTab,
  isRecentsActiveTab,
  isTaxonomyActiveTab,
  isTaxonomyEligibleAssetTab,
} from '../utils/taxonomyRoutingUtils';

export interface TaxonomyViewState {
  /** The tab supports the taxonomy view, so the toggle should be offered. */
  canUseTaxonomy: boolean;
  /**
   * The category chips are showing. Kept separate from {@link TaxonomyViewState.isTaxonomyView} so
   * All Asset Types, which is folder-backed rather than a category, still renders the chips and
   * stays reachable from them.
   */
  isTaxonomyMode: boolean;
  /** The grid should filter by taxonomy category. */
  isTaxonomyView: boolean;
  /**
   * The grid should list the creator's most recent items across every type they may upload. Mutually
   * exclusive with {@link TaxonomyViewState.isTaxonomyView}: Recents applies no category filter.
   */
  isRecentsView: boolean;
  /**
   * The grid should list the creator's avatar looks. Also mutually exclusive with
   * {@link TaxonomyViewState.isTaxonomyView}: looks are served by the look system, not by category.
   */
  isAvatarLooksView: boolean;
}

/**
 * Resolves how the Avatar Items page should present itself.
 *
 * The view follows `activeTab` alone: the two modes occupy separate namespaces (`AvatarItems…` for
 * categories, plain asset types for item types), so no second query param is needed to disambiguate
 * them — and there is no second writer that can disagree with the first.
 */
const useTaxonomyView = (assetType: Asset): TaxonomyViewState => {
  const [{ activeTab }] = useQueryParams(['activeTab']);

  const isFlagEnabled = useTaxonomyDashboardGate();
  const isTaxonomyMode = isFlagEnabled && isTaxonomyActiveTab(activeTab);
  const isRecentsView = isTaxonomyMode && isRecentsActiveTab(activeTab);
  const isAvatarLooksView = isTaxonomyMode && isAvatarLooksActiveTab(activeTab);

  return {
    canUseTaxonomy: isFlagEnabled && (isTaxonomyMode || isTaxonomyEligibleAssetTab(assetType)),
    isTaxonomyMode,
    // The tabs that live in this namespace without being categories filter by something other than a
    // taxonomy id, so none of them drive the category listing.
    isTaxonomyView:
      isTaxonomyMode &&
      !isAllAssetTypesActiveTab(activeTab) &&
      !isRecentsActiveTab(activeTab) &&
      !isAvatarLooksActiveTab(activeTab),
    isRecentsView,
    isAvatarLooksView,
  };
};

export default useTaxonomyView;

import type { Asset } from '@modules/miscellaneous/common';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import {
  isAllAssetTypesActiveTab,
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
}

/**
 * Resolves how the Avatar Items page should present itself.
 *
 * The view follows `activeTab` alone: the two modes occupy separate namespaces (`AvatarItems…` for
 * categories, plain asset types for item types), so no second query param is needed to disambiguate
 * them — and there is no second writer that can disagree with the first.
 */
const useTaxonomyView = (assetType: Asset): TaxonomyViewState => {
  const { settings } = useSettings();
  const [{ activeTab }] = useQueryParams(['activeTab']);

  const isFlagEnabled = settings.enableTaxonomyBasedCreatorDashboard ?? false;
  const isTaxonomyMode = isFlagEnabled && isTaxonomyActiveTab(activeTab);

  return {
    canUseTaxonomy: isFlagEnabled && (isTaxonomyMode || isTaxonomyEligibleAssetTab(assetType)),
    isTaxonomyMode,
    isTaxonomyView: isTaxonomyMode && !isAllAssetTypesActiveTab(activeTab),
  };
};

export default useTaxonomyView;

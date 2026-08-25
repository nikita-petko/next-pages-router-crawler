import { Asset } from '@modules/miscellaneous/common';
import { readQueryValue } from '@modules/miscellaneous/utils/queryToString';
import MenuItems from '../../menu/constants/MenuConstants';

/**
 * `activeTab` value for the taxonomy-based Avatar Items view. Used on its own for "the default
 * category", or with a `-{taxonomyKey}` suffix to select a specific L1 (a category `webStableId`,
 * or a synthetic key such as `classics`).
 *
 * Legacy deep links carry a plain asset type (e.g. `activeTab=TShirtAccessory`) and therefore never
 * parse as a taxonomy tab, which keeps them on the item-type view.
 */
export const AVATAR_ITEMS_ACTIVE_TAB = 'AvatarItems';

const AVATAR_ITEMS_ACTIVE_TAB_PREFIX = `${AVATAR_ITEMS_ACTIVE_TAB}-`;

/**
 * Asset tab that backs the taxonomy view internally. A taxonomy `activeTab` carries no asset type,
 * so menu and navigation state resolve through this Avatar Items submenu entry while the taxonomy
 * chips drive the actual filtering. It is never written to the URL.
 */
export const TAXONOMY_HOST_ASSET = Asset.HairAccessory;

/** Builds the `activeTab` value for a taxonomy L1 selection, or for the default category. */
export function buildTaxonomyActiveTab(taxonomyKey?: string): string {
  return taxonomyKey ? `${AVATAR_ITEMS_ACTIVE_TAB_PREFIX}${taxonomyKey}` : AVATAR_ITEMS_ACTIVE_TAB;
}

/** Whether the given `activeTab` query value targets the taxonomy-based view. */
export function isTaxonomyActiveTab(value: string | string[] | undefined | null): boolean {
  const raw = readQueryValue(value);
  return (
    raw === AVATAR_ITEMS_ACTIVE_TAB || (raw?.startsWith(AVATAR_ITEMS_ACTIVE_TAB_PREFIX) ?? false)
  );
}

/**
 * Extracts the L1 `taxonomyKey` from an `activeTab` query value. Returns `undefined` when the value
 * is not a taxonomy tab, or when it selects the default category rather than a specific one; use
 * {@link isTaxonomyActiveTab} to tell those apart.
 */
export function parseTaxonomyActiveTab(
  value: string | string[] | undefined | null,
): string | undefined {
  const raw = readQueryValue(value);
  if (raw === undefined || !raw.startsWith(AVATAR_ITEMS_ACTIVE_TAB_PREFIX)) {
    return undefined;
  }
  const key = raw.slice(AVATAR_ITEMS_ACTIVE_TAB_PREFIX.length);
  return key.length > 0 ? key : undefined;
}

/**
 * L1 key for the folder-backed "All Asset Types" tab. It is not a taxonomy category, but it lives in
 * the taxonomy `activeTab` namespace so that selecting it keeps the category chips on screen.
 */
export const ALL_ASSET_TYPES_L1_KEY = 'all';

/** Whether the given `activeTab` selects the folder-backed All Asset Types tab. */
export function isAllAssetTypesActiveTab(value: string | string[] | undefined | null): boolean {
  return parseTaxonomyActiveTab(value) === ALL_ASSET_TYPES_L1_KEY;
}

/**
 * L1 key for the "Recents" tab, which lists the creator's most recently created items across every
 * type they may upload. Like {@link ALL_ASSET_TYPES_L1_KEY} it is not a taxonomy category, but lives
 * in the taxonomy `activeTab` namespace so selecting it keeps the category chips on screen.
 */
export const RECENTS_L1_KEY = 'recents';

/**
 * `activeTab` value for Recents outside the taxonomy namespace. Recents is reachable from both
 * views, so it needs a representation in each: selecting it from the item-type view must not put
 * the URL into the taxonomy namespace, because that is what the toggle reads.
 */
export const RECENTS_ACTIVE_TAB = 'Recents';

/** Whether the given `activeTab` selects the Recents tab, in either view. */
export function isRecentsActiveTab(value: string | string[] | undefined | null): boolean {
  return (
    readQueryValue(value) === RECENTS_ACTIVE_TAB || parseTaxonomyActiveTab(value) === RECENTS_L1_KEY
  );
}

/**
 * L1 key for Avatars. Avatar looks are curated outfits rather than marketplace items, so the taxonomy
 * tree has no category for them — but that is a reason for them to have no category, not a reason for
 * the category view to make them unreachable. Keeping them in this namespace means selecting Avatars
 * stays inside the category view rather than switching back to the item-type one.
 */
export const AVATAR_LOOKS_L1_KEY = 'looks';

/** Whether the given `activeTab` selects the Avatars tab. */
export function isAvatarLooksActiveTab(value: string | string[] | undefined | null): boolean {
  return parseTaxonomyActiveTab(value) === AVATAR_LOOKS_L1_KEY;
}

/**
 * Every tab under Avatar Items, derived from the menu definition so the two cannot drift. The
 * taxonomy view is offered across all of them, including Backgrounds, Looks and All Asset Types.
 */
const AVATAR_ITEMS_TAB_TYPES = new Set<Asset>(
  MenuItems.find((menuItem) => menuItem.nameKey === 'Label.AvatarItems')?.submenuItems?.map(
    (submenuItem) => submenuItem.type,
  ) ?? [],
);

/** Whether the taxonomy view can be offered on the given tab. */
export function isTaxonomyEligibleAssetTab(assetType: Asset): boolean {
  return AVATAR_ITEMS_TAB_TYPES.has(assetType);
}

/**
 * Whether a menu navigation to `nextAssetType` should land on the taxonomy view instead of an
 * item-type tab.
 *
 * The category view is the default for Avatar Items, so entering the section from anywhere else
 * opens it. Moving between tabs within Avatar Items is excluded: that is how the item-type view is
 * navigated after the toolbar toggle opts out, and rewriting it would make the opt-out impossible.
 */
export function shouldOpenTaxonomyView({
  isTaxonomyEnabled,
  isChangingSection,
  nextAssetType,
}: {
  isTaxonomyEnabled: boolean;
  isChangingSection: boolean;
  nextAssetType: Asset;
}): boolean {
  return isTaxonomyEnabled && isChangingSection && isTaxonomyEligibleAssetTab(nextAssetType);
}

import type { CategoryNode, GetCategoriesResponse } from '@modules/clients/itemconfiguration';
import Look from '@modules/miscellaneous/common/enums/Look';
import { getTaxonomyDisplayName } from '../../unifiedFeeSystem/helper/UnifiedFeeSystemHelper';
import type { AvatarItemDropdown } from '../constants/avatarItemConstants';

/**
 * Classic 2D asset type ids (Classic T-Shirt, Classic Shirt, Classic Pants). The CreatorDashboard
 * tree nests these under "Clothing"; the Creator Dashboard lifts them into a dedicated, taxonomy
 * agnostic "Classics" L1 (see {@link transformCreatorDashboardTree}).
 */
export const CLASSIC_ASSET_TYPE_IDS = new Set<number>([2, 11, 12]);

/** Makeup asset type ids (Eye/Lip/Face Makeup, Eyelashes, Eyebrows). Gated behind enableMakeupAssets. */
export const MAKEUP_ASSET_TYPE_IDS = new Set<number>([76, 77, 88, 89, 90]);

/** Background asset type id. Gated behind enableAvatarBackgrounds. */
export const BACKGROUND_ASSET_TYPE_IDS = new Set<number>([92]);

/**
 * Bundle type ids that are UGC-publishable but are still reported as non-publishable by the
 * taxonomy data (Animation Bundles). Without this they would be filtered out and the category would
 * disappear from the sub-selector.
 * TODO(taxonomy): remove once the tree reports isPublishable correctly for these nodes.
 */
export const PUBLISHABLE_DESPITE_TREE_BUNDLE_TYPE_IDS = new Set<number>([4]);

/** Stable, synthetic identifier for the FE-only "Classics" L1 (has no server-side taxonomy id). */
export const CLASSICS_L1_KEY = 'classics';

/**
 * Visibility inputs for the transform. Both flags mean "this creator may see the category", not just
 * "the setting is on": the caller combines each setting with the creator's allowed marketplace asset
 * types, which is what restricts Backgrounds and Makeup to the trusted creator program.
 */
export interface TaxonomyTransformOptions {
  enableMakeupAssets: boolean;
  enableAvatarBackgrounds: boolean;
}

/**
 * A normalized L1 category ready for the chip row. Real tree nodes expose their `webStableId`
 * (taxonomy id); the synthetic Classics L1 is taxonomy agnostic (`webStableId` undefined) and is
 * navigated via its children only.
 */
export interface ProcessedCategory {
  key: string;
  name: string;
  webStableId?: string;
  /** Asset type ids backing this L1, used to pick its upload / create-asset entry point. */
  assetTypeIds?: number[];
  /** The Makeup L1, which additionally offers the Makeup look in its sub-selector. */
  isMakeup?: boolean;
  children: CategoryNode[];
}

function assetTypeIdsOf(node: CategoryNode): number[] {
  return node.assetTypeIds ?? [];
}

function nodeMatchesAssetTypes(node: CategoryNode, ids: Set<number>): boolean {
  return assetTypeIdsOf(node).some((id) => ids.has(id));
}

export function isClassicLeaf(node: CategoryNode): boolean {
  return nodeMatchesAssetTypes(node, CLASSIC_ASSET_TYPE_IDS);
}

export function isMakeupLeaf(node: CategoryNode): boolean {
  return nodeMatchesAssetTypes(node, MAKEUP_ASSET_TYPE_IDS);
}

export function isBackgroundNode(node: CategoryNode): boolean {
  return nodeMatchesAssetTypes(node, BACKGROUND_ASSET_TYPE_IDS);
}

/**
 * Whether a leaf category is UGC-publishable, and therefore shown in the Creator Dashboard. This is
 * the authoritative visibility signal from the taxonomy tree (it is what hides Gear).
 *
 * Backgrounds and Animation Bundles are publishable in practice but still carry stale
 * `isPublishable: false` in the taxonomy data. They are exempted here so the categories are not
 * missing from the dashboard; the exemptions come out once the upstream values are corrected. Note
 * Backgrounds stays gated by `enableAvatarBackgrounds`, which the caller resolves against the
 * creator's allowed marketplace types, so this exemption does not widen who can see it.
 */
function isLeafPublishable(node: CategoryNode): boolean {
  if (node.isPublishable === true) {
    return true;
  }
  if (isBackgroundNode(node)) {
    return true;
  }
  return (node.bundleTypeIds ?? []).some((id) => PUBLISHABLE_DESPITE_TREE_BUNDLE_TYPE_IDS.has(id));
}

/**
 * Normalizes the raw CreatorDashboard taxonomy tree into the L1 list rendered by the Creator
 * Dashboard chip row:
 *  - Non-publishable leaves are filtered out via `isPublishable` (this is what hides Gear).
 *  - Makeup leaves are additionally gated behind `enableMakeupAssets`.
 *  - Backgrounds is shown only when `enableAvatarBackgrounds` allows it (parity with the legacy tab,
 *    which also requires the creator to be allowed to publish backgrounds).
 *  - 2D Classics leaves are lifted out of Clothing into a dedicated, taxonomy-agnostic Classics L1.
 *  - L1s left with no visible leaves are dropped (leaf L1s such as Backgrounds are kept).
 */
export function transformCreatorDashboardTree(
  response: GetCategoriesResponse | undefined,
  options: TaxonomyTransformOptions,
): ProcessedCategory[] {
  const rawL1s = response?.categories ?? [];
  const classicLeaves: CategoryNode[] = [];
  const result: ProcessedCategory[] = [];

  rawL1s.forEach((l1) => {
    // Leaf L1 (e.g. Backgrounds): navigated by its own taxonomy id, no children.
    const rawChildren = l1.children ?? [];
    const isLeafL1 = rawChildren.length === 0;

    if (isLeafL1) {
      if (!isLeafPublishable(l1)) {
        return;
      }
      if (isBackgroundNode(l1) && !options.enableAvatarBackgrounds) {
        return;
      }
      if (!l1.webStableId) {
        return;
      }
      result.push({
        key: l1.webStableId,
        name: l1.name ?? '',
        webStableId: l1.webStableId,
        assetTypeIds: l1.assetTypeIds,
        children: [],
      });
      return;
    }

    const visibleChildren: CategoryNode[] = [];
    let hasMakeupLeaf = false;
    rawChildren.forEach((child) => {
      // Makeup is gated by its own flag rather than by `isPublishable`, whose values for makeup are
      // not yet accurate in the taxonomy data.
      if (isMakeupLeaf(child)) {
        if (options.enableMakeupAssets) {
          hasMakeupLeaf = true;
          visibleChildren.push(child);
        }
        return;
      }
      if (!isLeafPublishable(child)) {
        return;
      }
      if (isClassicLeaf(child)) {
        classicLeaves.push(child);
        return;
      }
      visibleChildren.push(child);
    });

    if (visibleChildren.length === 0 || !l1.webStableId) {
      return;
    }

    result.push({
      key: l1.webStableId,
      name: l1.name ?? '',
      webStableId: l1.webStableId,
      assetTypeIds: l1.assetTypeIds,
      isMakeup: hasMakeupLeaf,
      children: visibleChildren,
    });
  });

  if (classicLeaves.length > 0) {
    result.push({
      key: CLASSICS_L1_KEY,
      // A canonical name like the server-provided categories, so it localizes the same way.
      name: 'Classics',
      webStableId: undefined,
      children: classicLeaves,
    });
  }

  return result;
}

/**
 * Maps a taxonomy category node to an {@link AvatarItemDropdown} used by the Creator Dashboard
 * chips / sub-selector. The node's `webStableId` is carried as `taxonomy` so the by-creator
 * listing filters by this category. `skipTranslation` marks the name as a canonical name rather
 * than a translation key, which is what {@link taxonomyOptionLabel} localizes it by.
 */
export function categoryNodeToDropdown(node: CategoryNode): AvatarItemDropdown {
  return {
    nameKey: node.name ?? '',
    taxonomy: node.webStableId,
    taxonomyAssetTypeIds: node.assetTypeIds,
    skipTranslation: true,
  };
}

/**
 * The {@link categoryNodeToDropdown} equivalent for an already-transformed category, which
 * additionally carries the key the URL addresses it by.
 */
export function categoryToDropdown(category: ProcessedCategory): AvatarItemDropdown {
  return {
    nameKey: category.name,
    taxonomy: category.webStableId,
    taxonomyKey: category.key,
    taxonomyAssetTypeIds: category.assetTypeIds,
    skipTranslation: true,
  };
}

/**
 * Top-level (L1) taxonomy categories, rendered as the primary chip row. Applies the CreatorDashboard
 * transform (gear/publishable filter, makeup + backgrounds gating, Classics lift).
 */
/**
 * Display text for a taxonomy option.
 *
 * Category names arrive as canonical (English) names rather than translation keys, so they are
 * localized through the Taxonomy namespace, which is keyed off those names and falls back to the
 * canonical name when a category has no entry yet. Overlaid entries (the Makeup look) carry a real
 * translation key instead and are translated directly.
 */
export function taxonomyOptionLabel(
  option: AvatarItemDropdown,
  translate: (key: string) => string | null | undefined,
): string {
  if (option.skipTranslation) {
    return getTaxonomyDisplayName(option.nameKey, translate);
  }
  return translate(option.nameKey) ?? option.nameKey;
}

export function buildTaxonomyL1Options(categories: ProcessedCategory[]): AvatarItemDropdown[] {
  return categories.map(categoryToDropdown);
}

/**
 * Sub-categories (L2) under a given processed L1, rendered in the sub-selector dropdown.
 *
 * Only leaf categories are listed. The L1 itself is deliberately excluded: `filterIndex` defaults to
 * 0, so listing the parent would make the default selection the whole L1 rather than a sub-category.
 * Returns an empty array when the L1 has no children (the chip is itself a leaf).
 */
export function buildTaxonomyL2Options(l1?: ProcessedCategory): AvatarItemDropdown[] {
  const children = (l1?.children ?? []).filter((node) => node.webStableId);
  const childOptions = children.map(categoryNodeToDropdown);

  // The Makeup look is served by the look system rather than the taxonomy tree, so it is overlaid
  // alongside the makeup categories.
  if (l1?.isMakeup) {
    childOptions.push({ lookType: Look.Makeup, nameKey: 'Label.Looks' });
  }

  return childOptions;
}

/**
 * Stable identifier for a sub-selector option. Taxonomy categories are identified by their
 * `webStableId`; overlaid entries (such as the Makeup look) have no taxonomy id.
 */
export function taxonomyOptionValue(option: AvatarItemDropdown): string {
  if (option.taxonomy !== undefined) {
    return option.taxonomy;
  }
  if (option.lookType !== undefined) {
    return `look:${option.lookType}`;
  }
  return option.nameKey;
}

/**
 * Finds the processed L1 whose `key` matches the given selection, so the container can look up its
 * L2 options after a chip is selected.
 */
export function findL1Category(
  categories: ProcessedCategory[],
  key: string | undefined,
): ProcessedCategory | undefined {
  if (!key) {
    return undefined;
  }
  return categories.find((category) => category.key === key);
}

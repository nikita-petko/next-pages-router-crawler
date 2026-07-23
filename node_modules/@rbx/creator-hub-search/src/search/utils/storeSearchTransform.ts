import type { ToolboxSearchResult } from '../../clients/toolboxSearchClient';
import { NavigationTypeRaw } from '../../utilities/pageBuild/types/NavigationRaw';
import { DISPLAY_SEPARATOR } from '../searchListItemUtils';
import type { TSearchListItem } from '../types/SearchListItem';
import type { TSearchResult } from '../types/SearchResult';

type TranslateFn = (key: string, params?: Record<string, string>) => string;

const CATEGORY_PATH_DISPLAY: Record<string, { key: string; fallback: string }> = {
  '3d': { key: '3DAssets', fallback: '3D Assets' },
  gameplay: { key: 'Gameplay', fallback: 'Gameplay' },
  '2d': { key: '2DAssets', fallback: '2D Assets' },
  'visual-effect': { key: 'VisualEffects', fallback: 'Visual Effects' },
};

export function formatStorePrice(
  result: Pick<ToolboxSearchResult, 'isFree' | 'price'>,
  locale: string,
  translate: TranslateFn,
): string | null {
  if (result.isFree) {
    return translate('Label.Free') || 'FREE';
  }
  if (!result.price) {
    return null;
  }
  const { currencyCode, amount } = result.price;
  if (currencyCode === 'Robux') {
    return translate('Label.PriceInRobux', { price: String(amount) }) || `${amount} Robux`;
  }
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  } catch {
    return `${amount} ${currencyCode}`;
  }
}

export function buildStoreSecondaryLine(
  priceLabel: string | null,
  categoryLabel: string,
  categoryPathLabel: string | null,
  creatorName: string,
): string {
  return [priceLabel, categoryLabel, categoryPathLabel, creatorName]
    .filter((segment): segment is string => Boolean(segment))
    .join(DISPLAY_SEPARATOR);
}

export function mapStoreResultsToListItems(
  results: ToolboxSearchResult[],
  searchSessionId: string,
  locale: string,
  translate: TranslateFn,
): TSearchListItem[] {
  return results.map((result) => {
    const category = translate(`Label.${result.categoryType}`) || result.categoryType;
    const pathEntry = result.categoryPath ? CATEGORY_PATH_DISPLAY[result.categoryPath] : null;
    const categoryPathLabel = pathEntry
      ? translate(`Label.StoreCategoryPath.${pathEntry.key}`) || pathEntry.fallback
      : null;
    const priceLabel = formatStorePrice(result, locale, translate);
    const secondaryLine = buildStoreSecondaryLine(
      priceLabel,
      category,
      categoryPathLabel,
      result.creatorName,
    );

    const searchResult: TSearchResult = {
      title: result.name,
      description: result.description,
      url: result.url,
      documentationContentType: 'Store',
      documentationSubType: null,
      documentationThirdType: null,
      category,
      categoryTranslationLabels: [],
      deprecated: false,
      searchSessionId,
      creatorName: result.creatorName,
      storeSearchCategory: result.categoryType,
    };

    return {
      ...searchResult,
      id: result.url,
      path: result.url,
      type: NavigationTypeRaw.Markdown,
      documentationContentType: 'Store',
      translatedCategoryDisplayText: secondaryLine,
      resultRef: searchResult,
      // Prefer the creator's first preview image; fall back to the asset's own
      // thumbnail. Both resolve through the thumbnails service as asset images.
      storeThumbnailAssetId: result.thumbnailAssetId ?? result.id,
      storeCategoryIndex: result.categoryIndex,
    };
  });
}

/** Default number of results shown per category on the Store "all results" view. */
export const STORE_RESULTS_PER_CATEGORY = 2;

/**
 * Orders Store results for the "all results" view: up to `perCategory` results
 * from each source category, grouped together in category order — e.g. 2 Models,
 * then 2 "3D", then 2 Audio, etc. This replaces the round-robin order used for
 * the compact (default) Store section, which interleaves one per category.
 *
 * Results without a `storeCategoryIndex` are bucketed under index 0.
 */
export function orderStoreItemsByCategory(
  items: TSearchListItem[],
  perCategory: number = STORE_RESULTS_PER_CATEGORY,
): TSearchListItem[] {
  const byCategory = new Map<number, TSearchListItem[]>();
  items.forEach((item) => {
    const index = item.storeCategoryIndex ?? 0;
    const bucket = byCategory.get(index) ?? [];
    if (bucket.length < perCategory) {
      bucket.push(item);
    }
    byCategory.set(index, bucket);
  });
  return Array.from(byCategory.keys())
    .sort((a, b) => a - b)
    .flatMap((index) => byCategory.get(index) ?? []);
}

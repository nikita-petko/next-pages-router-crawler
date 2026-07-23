import type { FunctionComponent } from 'react';
import {
  SvgIcon2DAssets,
  SvgIcon3DAssets,
  SvgIconAudio,
  SvgIconGameplay,
  SvgIconPlugins,
  SvgIconVisualEffects,
} from '../storeCategoryIcons';

export interface StoreCategoryTile {
  id: string;
  translationKey: string;
  fallbackLabel: string;
  storePath: string;
  Icon: FunctionComponent;
}

/**
 * Tiles shown at the bottom of the search dialog when the Store display filter
 * is active. Each tile deep-links to the corresponding Creator Store category
 * page, optionally prefilling the user's current query as ?keyword=.
 */
export const STORE_CATEGORY_TILES: readonly StoreCategoryTile[] = [
  {
    id: '3d',
    translationKey: 'Label.Store3DAssets',
    fallbackLabel: '3D Assets',
    storePath: '/store/category/3d',
    Icon: SvgIcon3DAssets,
  },
  {
    id: 'visual-effects',
    translationKey: 'Label.StoreVisualEffects',
    fallbackLabel: 'Visual Effects',
    storePath: '/store/category/visual-effects',
    Icon: SvgIconVisualEffects,
  },
  {
    id: '2d',
    translationKey: 'Label.Store2DAssets',
    fallbackLabel: '2D Assets',
    storePath: '/store/category/2d',
    Icon: SvgIcon2DAssets,
  },
  {
    id: 'gameplay',
    translationKey: 'Label.StoreGameplay',
    fallbackLabel: 'Gameplay',
    storePath: '/store/category/gameplay',
    Icon: SvgIconGameplay,
  },
  {
    id: 'plugins',
    translationKey: 'Label.StorePlugins',
    fallbackLabel: 'Plugins',
    storePath: '/store/plugins',
    Icon: SvgIconPlugins,
  },
  {
    id: 'audio',
    translationKey: 'Label.StoreAudio',
    fallbackLabel: 'Audio',
    storePath: '/store/audio',
    Icon: SvgIconAudio,
  },
];

/**
 * Build a Creator Store URL for the given category path. When the trimmed
 * query is non-empty, append it as the `keyword` query parameter so the
 * destination page is pre-filtered.
 */
export function buildStoreCategoryUrl(
  creatorHubBaseUrl: string,
  storePath: string,
  query: string,
): string {
  const trimmed = query.trim();
  if (!trimmed) {
    return `${creatorHubBaseUrl}${storePath}`;
  }
  return `${creatorHubBaseUrl}${storePath}?keyword=${encodeURIComponent(trimmed)}`;
}

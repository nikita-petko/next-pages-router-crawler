import { MAX_SHOWCASE_ITEMS, MIN_SHOWCASE_ITEMS } from '../constants';
import type { ShowcaseDraft, ShowcaseItem } from '../types';

export type ShowcaseDraftError = 'TitleRequired' | 'TooFewItems' | 'TooManyItems';

export const getShowcaseDraftErrors = (draft: ShowcaseDraft): ShowcaseDraftError[] => {
  const errors: ShowcaseDraftError[] = [];

  if (draft.title.trim().length === 0) {
    errors.push('TitleRequired');
  }
  if (draft.items.length < MIN_SHOWCASE_ITEMS) {
    errors.push('TooFewItems');
  }
  if (draft.items.length > MAX_SHOWCASE_ITEMS) {
    errors.push('TooManyItems');
  }

  return errors;
};

export const canPublishShowcase = (draft: ShowcaseDraft): boolean =>
  getShowcaseDraftErrors(draft).length === 0;

export const getRemainingItemSlots = (items: ShowcaseItem[]): number =>
  Math.max(0, MAX_SHOWCASE_ITEMS - items.length);

/** FR-C2.4.1: a showcase cannot contain the same item twice. */
export const dedupeByAssetId = (items: ShowcaseItem[]): ShowcaseItem[] => {
  const seen = new Set<number>();
  return items.filter((item) => {
    if (seen.has(item.assetId)) {
      return false;
    }
    seen.add(item.assetId);
    return true;
  });
};

/**
 * Parses the picker's free-text id entry. Accepts comma, whitespace or newline
 * separated ids and drops anything non-numeric so a stray paste cannot produce NaN.
 */
export const parseAssetIdInput = (value: string): number[] =>
  value
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter((token) => /^\d+$/.test(token))
    .map(Number);

/** Moves `assetId` to the front of the render order (FR-C2.5, manual ordering). */
export const bringToFront = (items: ShowcaseItem[], assetId: number): ShowcaseItem[] => {
  const target = items.find((item) => item.assetId === assetId);
  if (!target) {
    return items;
  }
  return [target, ...items.filter((item) => item.assetId !== assetId)];
};

export const sendToBack = (items: ShowcaseItem[], assetId: number): ShowcaseItem[] => {
  const target = items.find((item) => item.assetId === assetId);
  if (!target) {
    return items;
  }
  return [...items.filter((item) => item.assetId !== assetId), target];
};

export const removeItem = (items: ShowcaseItem[], assetId: number): ShowcaseItem[] =>
  items.filter((item) => item.assetId !== assetId);

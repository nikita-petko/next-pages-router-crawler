import { RAQIV2Dimension, type TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';

/**
 * A universe with exactly one Place option has nothing to aggregate across.
 * The Place filter is still auto-selected for queries (Place Version still
 * needs a parent), but the control and chips stay hidden.
 * Distinct from the Place Version breakdown constraint, which injects a
 * root-place filter only while that breakdown is active.
 */
export const isForcedSinglePlaceFilter = (
  dimension: TRAQIV2Dimension,
  placeOptionCount: number,
): boolean => dimension === RAQIV2Dimension.Place && placeOptionCount === 1;

const areStringArraysEqual = (left: readonly string[], right: readonly string[]): boolean =>
  left.length === right.length && left.every((value, index) => value === right[index]);

export type PlaceFilterCoerceResult =
  | { readonly kind: 'unchanged' }
  | { readonly kind: 'inject'; readonly values: readonly string[] }
  | { readonly kind: 'hydrate'; readonly values: readonly string[] };

/**
 * Correct Place query state against the analytics-visible option list.
 *
 * `onlyFilterSupportedValues` hides missing option rows; it does not clear
 * the selected ids. Call this after options resolve:
 * - Empty selection + one option: persist-inject that place (single-place).
 * - Selected id gone, other places remain: Experience (`[]`), as hydrate.
 * - Selected id gone and only one option left: inject+hide that place, as hydrate.
 * - Valid saved ids are left alone.
 *
 * Returns `unchanged` while the option list is empty so loaders / failed
 * requests do not wipe a saved Place.
 */
export const coercePlaceFilterValues = (
  selectedValues: readonly string[],
  placeOptionIds: readonly string[],
): PlaceFilterCoerceResult => {
  if (placeOptionIds.length === 0) {
    return { kind: 'unchanged' };
  }

  const optionSet = new Set(placeOptionIds);
  const validSelected = selectedValues.filter((value) => optionSet.has(value));
  const selectedIsMissing =
    selectedValues.length > 0 && validSelected.length !== selectedValues.length;

  if (selectedValues.length > 0 && !selectedIsMissing) {
    return { kind: 'unchanged' };
  }

  if (placeOptionIds.length === 1) {
    const [onlyPlaceId] = placeOptionIds;
    if (onlyPlaceId === undefined) {
      return { kind: 'unchanged' };
    }
    const nextValues = [onlyPlaceId];
    if (areStringArraysEqual(selectedValues, nextValues)) {
      return { kind: 'unchanged' };
    }
    if (selectedValues.length === 0) {
      return { kind: 'inject', values: nextValues };
    }
    return { kind: 'hydrate', values: nextValues };
  }

  if (selectedIsMissing) {
    return { kind: 'hydrate', values: validSelected };
  }

  return { kind: 'unchanged' };
};

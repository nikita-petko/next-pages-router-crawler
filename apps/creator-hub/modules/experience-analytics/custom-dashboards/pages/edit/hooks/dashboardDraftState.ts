import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { getDashboardSurface, withDashboardSurface } from '../../../layout/dashboardLayout';
import type { CustomDashboardConfig, TileFilter } from '../../../types';
import { EMPTY_DASHBOARD_CONFIG } from '../../../types';

const PLACE_FILTER_DIMENSION: string = RAQIV2Dimension.Place;

export type DashboardDraft = {
  readonly name: string;
  readonly config: CustomDashboardConfig;
};

/**
 * Deterministic JSON: object keys are emitted in sorted order at every depth so
 * two structurally equal drafts always serialize identically. Plain
 * `JSON.stringify` preserves insertion order, so an edit that rebuilds an object
 * with a different key order (common when spreading/normalizing config) would
 * change the string without changing the data — producing false "unsaved
 * changes" positives. Arrays keep their order (it's semantic here).
 */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value) ?? 'null';
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  const entries = Object.entries(value)
    // Drop `undefined` so `{ a: undefined }` and `{}` compare equal, matching
    // JSON semantics (JSON.stringify omits undefined-valued keys).
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
}

function withPlaceFilterValues(
  filters: ReadonlyArray<TileFilter> | undefined,
  placeValues: readonly string[],
): ReadonlyArray<TileFilter> {
  const existing = filters ?? [];
  const withoutPlace = existing.filter((filter) => filter.dimension !== PLACE_FILTER_DIMENSION);
  if (placeValues.length === 0) {
    return withoutPlace;
  }
  return [...withoutPlace, { dimension: PLACE_FILTER_DIMENSION, values: [...placeValues] }];
}

/**
 * Writes a hydrated Place selection into the in-memory dashboard config
 * (`defaultFilters`). Title-only Save persists this working copy. Callers
 * rebase the dirty baseline to the same config so hydrate itself is not dirty.
 */
export function withHydratedPlaceDefaultFilter(
  config: CustomDashboardConfig,
  placeValues: readonly string[],
): CustomDashboardConfig {
  const surface = getDashboardSurface(config);
  return withDashboardSurface(config, {
    ...surface,
    controls: {
      ...surface.controls,
      defaultFilters: withPlaceFilterValues(surface.controls.defaultFilters, placeValues),
    },
  });
}

export function getDashboardDraftSignature(draft: DashboardDraft): string {
  try {
    return stableStringify({
      name: draft.name.trim(),
      config: draft.config,
    });
  } catch {
    return stableStringify({
      name: draft.name.trim(),
      config: EMPTY_DASHBOARD_CONFIG,
    });
  }
}

/**
 * True when the live editor draft would be abandoned by leaving the page.
 * New dashboards are dirty as soon as a working copy exists. Existing
 * dashboards compare a stable signature so key-order / undefined-key noise
 * does not look like an edit. Saving does not clear this on its own — the
 * caller deletes the working copy (or navigates away) after a successful
 * persist.
 */
export function isDashboardDraftDirty({
  currentDraft,
  isNewDashboard,
  persistedDraft,
}: {
  readonly currentDraft: DashboardDraft | null;
  readonly isNewDashboard: boolean;
  readonly persistedDraft: DashboardDraft | null;
}): boolean {
  if (!currentDraft) {
    return false;
  }
  if (isNewDashboard || !persistedDraft) {
    return true;
  }
  return getDashboardDraftSignature(currentDraft) !== getDashboardDraftSignature(persistedDraft);
}

import type { CustomDashboardConfig } from '../../../types';
import { EMPTY_DASHBOARD_CONFIG } from '../../../types';

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

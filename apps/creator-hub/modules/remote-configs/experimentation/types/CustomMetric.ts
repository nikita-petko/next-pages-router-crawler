import type { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { RAQIMetricFilter } from '@modules/clients/analytics';
import type { CustomMetricCalculation } from './CustomMetricCalculation';

/**
 * Domain model for a creator-defined custom metric attached to an experiment.
 *
 * Mirrors the Custom Metrics & Experiment Templates tech spec (Phase 1 / Alpha):
 * a metric is built on one of three event categories (Economy / Funnel /
 * Custom), reduced by a category-specific calculation, and optionally narrowed
 * by dimension filters. Each category has a required "primary" selection
 * (currency / funnel + target step / custom event) plus category-specific
 * optional filters.
 *
 * `CustomMetric` is a discriminated union keyed on `category`, so a metric only
 * carries the primary selection(s) that its category defines — an Economy
 * metric has `currency` and no `funnel`/`customEvent`, and so on. The category
 * is always concrete; the transient "no category chosen yet" state of a metric
 * being created lives in the form/drawer layer, not this domain model. The
 * primary-selection values stay nullable because they are filled in
 * progressively after the category is chosen.
 *
 * Dimensions reuse the analytics config enum (`RAQIV2Dimension`) — the same one
 * the explore-mode and economy/funnel/custom-event analytics pages use — rather
 * than a bespoke copy. The `calculation` uses the local, temporary
 * `CustomMetricCalculation` enum (to be folded into `RAQIV2Metric` once they
 * unify). `CustomMetricCategory` is also local: there is no clean reusable
 * 3-value enum for it (`RAQIV2Namespace` models the same split as namespace path
 * strings alongside many unrelated members, which is a different concept).
 *
 * This is still UI-only — captured in the create-experiment form but not yet
 * sent to the backend. It is gated behind the `isExperimentationTemplatesEnabled`
 * flag and only surfaced when the `Custom` metric set is chosen. The per-metric
 * create/edit drawer that populates this shape is not built yet.
 */

// The event category a custom metric is built on. Maps 1:1 to an IXP event
// source (esp_standard_{economy,funnel,custom}_event).
export enum CustomMetricCategory {
  Economy = 'Economy',
  Funnel = 'Funnel',
  Custom = 'Custom',
}

// Fields shared by every custom metric, regardless of category.
type CustomMetricBase = {
  // Client-only identifier used for stable list keys and edit/delete targeting.
  // Not persisted to the backend.
  id: string;
  name: string;
  // The computation this metric performs. Restricted per category — see
  // `CALCULATIONS_BY_CATEGORY` in `customMetricOptions`.
  calculation: CustomMetricCalculation | null;
  // Optional dimension filters. Each is an analytics dimension plus 1-10 values
  // (each up to 256 chars), mirroring the CETS filter contract. Reuses the
  // shared analytics `RAQIMetricFilter` shape — `{ dimension, values }` — keyed
  // to `RAQIV2Dimension` (e.g. CustomField1, TransactionType, ItemSku), the same
  // as the explore-mode / economy / funnel analytics filter bars.
  filters: RAQIMetricFilter<RAQIV2Dimension>[];
};

// Economy metric: reduces a currency flow. `currency` is the selected VALUE for
// `RAQIV2Dimension.CurrencyType`.
export type EconomyCustomMetric = CustomMetricBase & {
  category: CustomMetricCategory.Economy;
  currency: string | null;
};

// Funnel metric: `funnel` is the selected VALUE for `RAQIV2Dimension.FunnelName`
// and `funnelStep` is the selected VALUE for `RAQIV2Dimension.FunnelStep` (a step
// value scoped to the chosen funnel), like any other primary selection.
export type FunnelCustomMetric = CustomMetricBase & {
  category: CustomMetricCategory.Funnel;
  funnel: string | null;
  funnelStep: string | null;
};

// Custom-event metric: `customEvent` is the selected VALUE for
// `RAQIV2Dimension.CustomEventName`.
export type CustomEventCustomMetric = CustomMetricBase & {
  category: CustomMetricCategory.Custom;
  customEvent: string | null;
};

// A creator-defined custom metric, discriminated on `category`. Narrowing on
// `category` exposes only that category's primary selection field(s).
export type CustomMetric = EconomyCustomMetric | FunnelCustomMetric | CustomEventCustomMetric;

// Maximum number of custom metrics a creator may define per experiment.
export const MAX_CUSTOM_METRICS = 3;

// Maximum number of values a single filter dimension may hold.
export const MAX_CUSTOM_METRIC_FILTER_VALUES = 10;

// Maximum length of a metric name (and of a single filter value).
export const MAX_CUSTOM_METRIC_NAME_LENGTH = 256;

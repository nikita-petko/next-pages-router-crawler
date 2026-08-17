import { RAQIV2APIMetric, RAQIV2Dimension, RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2APIMetric } from '@rbx/creator-hub-analytics-config';
import type { RAQIMetricFilter } from '@modules/clients/analytics';
import type { CustomMetric } from '../types/CustomMetric';
import { CustomMetricCategory, MAX_CUSTOM_METRIC_NAME_LENGTH } from '../types/CustomMetric';
import { CUSTOM_METRIC_CALCULATION_LABELS } from '../types/CustomMetricCalculation';
import type { CustomMetricCalculation } from '../types/CustomMetricCalculation';

// Draft fields that hold a category's "primary" (dimension-value) selection.
export type PrimarySelectionField = 'currency' | 'funnel' | 'funnelStep' | 'customEvent';

/**
 * Transient editing shape for the create/edit custom-metric drawer.
 *
 * `CustomMetric` (the persisted domain model) is a discriminated union that only
 * carries the fields its category defines. The drawer, by contrast, needs a flat
 * superset so the user can flip the category dropdown without losing in-progress
 * input and without the form holding an invalid union member mid-edit. This
 * draft holds every category's primary-selection field; {@link draftToMetric}
 * narrows it back down to the correct union variant on Save, and
 * {@link metricToDraft} widens an existing metric for editing.
 *
 * Every primary selection is a dimension VALUE (a string), including funnel step
 * (the selected `RAQIV2Dimension.FunnelStep` value) — see
 * {@link PRIMARY_SELECTIONS_BY_CATEGORY}.
 */
export type CustomMetricDraft = {
  name: string;
  category: CustomMetricCategory;
  calculation: CustomMetricCalculation | null;
  // Primary selections — only the fields listed for `category` are used.
  currency: string | null; // Economy: value for RAQIV2Dimension.CurrencyType
  funnel: string | null; // Funnel: value for RAQIV2Dimension.FunnelName
  funnelStep: string | null; // Funnel: value for RAQIV2Dimension.FunnelStep
  customEvent: string | null; // Custom: value for RAQIV2Dimension.CustomEventName
  filters: RAQIMetricFilter<RAQIV2Dimension>[];
};

// One primary selection: a draft field backed by an analytics dimension whose
// values (and display names) come from the query gateway.
export type PrimarySelection = {
  field: PrimarySelectionField;
  dimension: RAQIV2Dimension;
  // When set, this selection's available values are scoped by the current value
  // of another selection — e.g. funnel step values (and their step names) are
  // scoped by the chosen funnel, so the gateway returns the right steps.
  scopedBy?: { field: PrimarySelectionField; dimension: RAQIV2Dimension };
};

// The ordered primary selections each category exposes. A category can have more
// than one (funnel = funnel name + funnel step); the drawer renders one
// dimension-value dropdown per entry, in order.
export const PRIMARY_SELECTIONS_BY_CATEGORY: Record<
  CustomMetricCategory,
  readonly PrimarySelection[]
> = {
  [CustomMetricCategory.Economy]: [{ field: 'currency', dimension: RAQIV2Dimension.CurrencyType }],
  [CustomMetricCategory.Funnel]: [
    { field: 'funnel', dimension: RAQIV2Dimension.FunnelName },
    {
      field: 'funnelStep',
      dimension: RAQIV2Dimension.FunnelStep,
      scopedBy: { field: 'funnel', dimension: RAQIV2Dimension.FunnelName },
    },
  ],
  [CustomMetricCategory.Custom]: [
    { field: 'customEvent', dimension: RAQIV2Dimension.CustomEventName },
  ],
};

// Metric context used to scope the analytics query-gateway value lookups for a
// category's dimensions — the gateway returns a dimension's values relative to a
// metric, so each category is anchored to a representative metric from its event
// source (the same metrics the economy / funnel / custom-event analytics pages
// query). `RAQIV2Metric` values are valid `TRAQIV2APIMetric`s.
export const CONTEXT_METRICS_BY_CATEGORY: Record<CustomMetricCategory, TRAQIV2APIMetric[]> = {
  [CustomMetricCategory.Economy]: [RAQIV2Metric.EconomyTransactionCount],
  [CustomMetricCategory.Funnel]: [RAQIV2Metric.FunnelStepTotalCount],
  [CustomMetricCategory.Custom]: [RAQIV2APIMetric.CustomEventCount],
};

// A fresh draft for the "Add custom metric" flow. Category defaults to Custom
// (the drawer opens on a concrete category, matching the design); everything
// else starts empty for the user to fill in.
export const makeEmptyDraft = (
  category: CustomMetricCategory = CustomMetricCategory.Custom,
): CustomMetricDraft => ({
  name: '',
  category,
  calculation: null,
  currency: null,
  funnel: null,
  funnelStep: null,
  customEvent: null,
  filters: [],
});

// Widen a persisted metric into the drawer's draft shape for editing. Only the
// metric's own category fields are populated; the rest stay null.
export const metricToDraft = (metric: CustomMetric): CustomMetricDraft => {
  const base = {
    name: metric.name,
    category: metric.category,
    calculation: metric.calculation,
    currency: null,
    funnel: null,
    funnelStep: null,
    customEvent: null,
    filters: metric.filters.map((filter) => ({ ...filter, values: [...filter.values] })),
  };
  switch (metric.category) {
    case CustomMetricCategory.Economy:
      return { ...base, currency: metric.currency };
    case CustomMetricCategory.Funnel:
      return { ...base, funnel: metric.funnel, funnelStep: metric.funnelStep };
    case CustomMetricCategory.Custom:
      return { ...base, customEvent: metric.customEvent };
    default: {
      const exhaustiveCheck: never = metric;
      throw new Error(`Unhandled custom metric category: ${String(exhaustiveCheck)}`);
    }
  }
};

// The draft's leading primary-selection value (custom event / currency / funnel
// name — the first selection for the category), or null if not yet chosen. Used
// to seed the auto-generated name.
export const getPrimaryValue = (draft: CustomMetricDraft): string | null => {
  const [firstSelection] = PRIMARY_SELECTIONS_BY_CATEGORY[draft.category];
  return draft[firstSelection.field];
};

// Narrow a draft back to the concrete `CustomMetric` union variant its category
// defines, stamping the provided client id. Assumes the draft is valid
// (see isDraftValid) — filters with no values are dropped so value-less rows the
// user left half-open don't get persisted.
export const draftToMetric = (draft: CustomMetricDraft, id: string): CustomMetric => {
  const base = {
    id,
    name: draft.name.trim(),
    calculation: draft.calculation,
    filters: draft.filters
      .filter((filter) => filter.values.length > 0)
      .map((filter) => ({ ...filter, values: [...filter.values] })),
  };
  switch (draft.category) {
    case CustomMetricCategory.Economy:
      return { ...base, category: CustomMetricCategory.Economy, currency: draft.currency };
    case CustomMetricCategory.Funnel:
      return {
        ...base,
        category: CustomMetricCategory.Funnel,
        funnel: draft.funnel,
        funnelStep: draft.funnelStep,
      };
    case CustomMetricCategory.Custom:
      return { ...base, category: CustomMetricCategory.Custom, customEvent: draft.customEvent };
    default: {
      const exhaustiveCheck: never = draft.category;
      throw new Error(`Unhandled custom metric category: ${String(exhaustiveCheck)}`);
    }
  }
};

// Suggested metric name derived from the current selections, e.g.
// "HerbsCollected (average) - PowerHerb". Used to keep the name field in sync
// with the selections until the creator edits it manually. Returns '' when
// there isn't enough selected to form a meaningful name.
export const buildAutoMetricName = (draft: CustomMetricDraft): string => {
  const primary = getPrimaryValue(draft);
  if (!primary) {
    return '';
  }
  const calculationPart = draft.calculation
    ? ` (${CUSTOM_METRIC_CALCULATION_LABELS[draft.calculation]})`
    : '';
  const firstFilterValue = draft.filters.find((filter) => filter.values.length > 0)?.values[0];
  const filterPart = firstFilterValue ? ` - ${firstFilterValue}` : '';
  return `${primary}${calculationPart}${filterPart}`;
};

// Whether the draft is complete enough to save: a name, a calculation, and
// every primary selection its category defines (e.g. funnel needs both a funnel
// and a funnel step).
export const isDraftValid = (draft: CustomMetricDraft): boolean => {
  const trimmedName = draft.name.trim();
  if (trimmedName.length === 0 || trimmedName.length > MAX_CUSTOM_METRIC_NAME_LENGTH) {
    return false;
  }
  if (draft.calculation === null) {
    return false;
  }
  return PRIMARY_SELECTIONS_BY_CATEGORY[draft.category].every((selection) => {
    const value = draft[selection.field];
    return value !== null && value !== '';
  });
};

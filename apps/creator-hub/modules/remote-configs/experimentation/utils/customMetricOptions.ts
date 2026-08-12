import { RAQIV2AggregationType, RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { RAQIMetricFilter } from '@modules/clients/analytics';
import type { CustomMetric } from '../types/CustomMetric';
import { CustomMetricCategory } from '../types/CustomMetric';

/**
 * Static option orderings and category → capability maps for the custom metric
 * builder, plus factories for empty form rows. These describe *what a category
 * allows*; the drawer UI is responsible for rendering the relevant controls and
 * resetting fields when the category changes.
 *
 * Dimensions/aggregations reuse the analytics config enums (`RAQIV2Dimension`,
 * `RAQIV2AggregationType`) so the option lists stay in lockstep with the rest
 * of the analytics surface. Display labels for each dimension come from
 * `RAQIV2DimensionDisplayConfig[dimension].name` at the call site — no bespoke
 * label table here.
 */

// Display order of categories in the "Category" dropdown.
export const CUSTOM_METRIC_CATEGORY_ORDER: readonly CustomMetricCategory[] = [
  CustomMetricCategory.Economy,
  CustomMetricCategory.Funnel,
  CustomMetricCategory.Custom,
];

// Aggregations offered per category. Phase 1 / Alpha exposes the Average
// aggregation for all three categories; the concrete IXP metric each resolves
// to (e.g. average currency change vs. average ending wallet balance vs. funnel
// conversion) is decided during backend instrumentation, not here.
export const AGGREGATIONS_BY_CATEGORY: Record<
  CustomMetricCategory,
  readonly RAQIV2AggregationType[]
> = {
  [CustomMetricCategory.Economy]: [RAQIV2AggregationType.Average],
  [CustomMetricCategory.Funnel]: [RAQIV2AggregationType.Average],
  [CustomMetricCategory.Custom]: [RAQIV2AggregationType.Average],
};

// Optional filter dimensions offered per category (the "Filters" section),
// scoped to the Alpha allow-list (custom fields 1-3 everywhere, plus
// transaction type and item SKU for economy).
export const FILTER_DIMENSIONS_BY_CATEGORY: Record<
  CustomMetricCategory,
  readonly RAQIV2Dimension[]
> = {
  [CustomMetricCategory.Economy]: [
    RAQIV2Dimension.TransactionType,
    RAQIV2Dimension.ItemSku,
    RAQIV2Dimension.CustomField1,
    RAQIV2Dimension.CustomField2,
    RAQIV2Dimension.CustomField3,
  ],
  [CustomMetricCategory.Funnel]: [
    RAQIV2Dimension.CustomField1,
    RAQIV2Dimension.CustomField2,
    RAQIV2Dimension.CustomField3,
  ],
  [CustomMetricCategory.Custom]: [
    RAQIV2Dimension.CustomField1,
    RAQIV2Dimension.CustomField2,
    RAQIV2Dimension.CustomField3,
  ],
};

// Whether a category requires a funnel target step (funnel_step) selection.
export const categoryRequiresFunnelStep = (category: CustomMetricCategory | null): boolean =>
  category === CustomMetricCategory.Funnel;

// Returns the filters that are complete enough to display (at least one value).
// Used to derive the summary chips shown on a metric row without surfacing
// value-less filter rows.
export const getDisplayableFilters = (metric: CustomMetric): RAQIMetricFilter<RAQIV2Dimension>[] =>
  metric.filters.filter((filter) => filter.values.length > 0);

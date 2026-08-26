import { VariantKind, type BreakdownSpec } from '@rbx/client-analytics-query-gateway/v1';
import {
  type TRAQIV2Dimension,
  type TUIPseudoDimensionMetricFanoutConfig,
  type RAQIV2AggregationType,
  RAQIV2DimensionDisplayConfig,
  RAQIV2PercentileType,
  RAQIV2UIPseudoDimension,
  RAQIV2UIPseudoDimensionType,
} from '@rbx/creator-hub-analytics-config';

export type MetricVariantKind = 'percentile' | 'aggregation';

export type MetricVariantFanout = {
  readonly mode: 'fanout';
  readonly kind: MetricVariantKind;
};

export type MetricVariantSingle =
  | {
      readonly mode: 'single';
      readonly kind: 'percentile';
      readonly value: RAQIV2PercentileType;
    }
  | {
      readonly mode: 'single';
      readonly kind: 'aggregation';
      readonly value: RAQIV2AggregationType;
    };

export type MetricVariant = MetricVariantFanout | MetricVariantSingle;

export type MetricFanoutDimensionInfo = {
  dimension: RAQIV2UIPseudoDimension;
  config: TUIPseudoDimensionMetricFanoutConfig<string>;
};

const MetricVariantKindToDimension: Record<MetricVariantKind, RAQIV2UIPseudoDimension> = {
  percentile: RAQIV2UIPseudoDimension.PercentileType,
  aggregation: RAQIV2UIPseudoDimension.AggregationType,
};

const averagePercentileValue: string = RAQIV2PercentileType.AVG;

export const isMetricVariantFanout = (
  metricVariant: MetricVariant | null | undefined,
): metricVariant is MetricVariantFanout => metricVariant?.mode === 'fanout';

export const metricVariantKindToDimension = (kind: MetricVariantKind): RAQIV2UIPseudoDimension =>
  MetricVariantKindToDimension[kind];

export const dimensionToMetricVariantKind = (
  dimension: TRAQIV2Dimension,
): MetricVariantKind | undefined => {
  if (dimension === RAQIV2UIPseudoDimension.PercentileType) {
    return 'percentile';
  }
  if (dimension === RAQIV2UIPseudoDimension.AggregationType) {
    return 'aggregation';
  }
  return undefined;
};

export const getFanoutOwnedDimension = (
  metricVariant: MetricVariant | null | undefined,
): RAQIV2UIPseudoDimension | undefined =>
  isMetricVariantFanout(metricVariant)
    ? metricVariantKindToDimension(metricVariant.kind)
    : undefined;

const toScreamingSnakeCase = (value: string): string =>
  value
    .replaceAll(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replaceAll(/[^A-Za-z0-9]+/g, '_')
    .toUpperCase()
    .replaceAll(/^_+|_+$/g, '');

export const getStableVariantKey = (dimension: RAQIV2UIPseudoDimension, value: string): string => {
  const normalized = toScreamingSnakeCase(value);
  if (normalized === averagePercentileValue || normalized === 'AVERAGE') {
    return 'AVERAGE';
  }

  if (dimension === RAQIV2UIPseudoDimension.PercentileType) {
    const percentileMatch = /^P?(\d+)$/.exec(normalized);
    if (percentileMatch) {
      return `P${percentileMatch[1]}`;
    }
    return normalized;
  }

  return normalized;
};

export const getVariantKind = (dimension: RAQIV2UIPseudoDimension): VariantKind | null => {
  if (dimension === RAQIV2UIPseudoDimension.PercentileType) {
    return VariantKind.Percentile;
  }
  if (dimension === RAQIV2UIPseudoDimension.AggregationType) {
    return VariantKind.Aggregation;
  }
  return null;
};

export const getMetricFanoutDimensionInfo = (
  metricVariant: MetricVariantFanout,
): MetricFanoutDimensionInfo | undefined => {
  const dimension = metricVariantKindToDimension(metricVariant.kind);
  const config = RAQIV2DimensionDisplayConfig[dimension].pseudoDimensionConfig;
  if (config.type !== RAQIV2UIPseudoDimensionType.MetricFanout) {
    return undefined;
  }
  return { dimension, config };
};

export const buildVariantBreakdownSpec = (breakdown: MetricFanoutDimensionInfo): BreakdownSpec => {
  const kind = getVariantKind(breakdown.dimension);
  if (kind == null) {
    throw new Error(`Unsupported metric variant breakdown ${breakdown.dimension}`);
  }
  return {
    variant: {
      kind,
      keys: breakdown.config.supportedDimensionValues.map((value) =>
        getStableVariantKey(breakdown.dimension, value),
      ),
    },
  };
};

/**
 * Page-level fanout is first-class `metricVariant` state. Leftover
 * PercentileType / AggregationType entries in `breakdown[]` are lifted so
 * older URLs and callers that still stuff variants into the dimension list
 * keep working until they rebase.
 */
export const splitMetricVariantFromBreakdown = (
  explicit: MetricVariant | null | undefined,
  breakdown: readonly TRAQIV2Dimension[] | undefined,
): {
  metricVariant: MetricVariant | undefined;
  breakdown: TRAQIV2Dimension[];
} => {
  const realBreakdown: TRAQIV2Dimension[] = [];
  const liftedKinds: MetricVariantKind[] = [];
  breakdown?.forEach((dimension) => {
    const kind = dimensionToMetricVariantKind(dimension);
    if (kind !== undefined) {
      if (!liftedKinds.includes(kind)) {
        liftedKinds.push(kind);
      }
      return;
    }
    realBreakdown.push(dimension);
  });

  if (isMetricVariantFanout(explicit)) {
    return { metricVariant: explicit, breakdown: realBreakdown };
  }

  // `mode: 'single'` is not request-path state yet (it still lives on filters /
  // source `pseudoDimensionValues`). Ignoring it here keeps leftover
  // PercentileType / AggregationType breakdown entries from being dropped
  // without a replacement fanout.
  const liftedKind = liftedKinds[0];
  if (!liftedKind) {
    return { metricVariant: undefined, breakdown: realBreakdown };
  }
  return {
    metricVariant: { mode: 'fanout', kind: liftedKind },
    breakdown: realBreakdown,
  };
};

export const supportedMetricVariantForDimensions = (
  metricVariant: MetricVariant | null | undefined,
  dimensions: readonly TRAQIV2Dimension[],
): MetricVariantFanout | undefined => {
  if (!isMetricVariantFanout(metricVariant)) {
    return undefined;
  }
  return dimensions.includes(metricVariantKindToDimension(metricVariant.kind))
    ? metricVariant
    : undefined;
};

/**
 * AggregationType is always filter-only in the Explore picker (it is not a
 * breakdown chip) but URL aggregation fanout still applies on every chart
 * type. PercentileType is filter-only for Area / Duration charts — drop that
 * fanout from the request spec so those types keep a single series.
 */
export const metricVariantAllowedForFilterOnlyDimensions = (
  metricVariant: MetricVariant | null | undefined,
  filterOnlyDimensions: readonly TRAQIV2Dimension[],
): MetricVariantFanout | undefined => {
  if (!isMetricVariantFanout(metricVariant)) {
    return undefined;
  }
  const owned = metricVariantKindToDimension(metricVariant.kind);
  if (owned === RAQIV2UIPseudoDimension.AggregationType) {
    return metricVariant;
  }
  return filterOnlyDimensions.includes(owned) ? undefined : metricVariant;
};

export const mergeMetricVariantIntoBreakdown = (
  breakdown: readonly TRAQIV2Dimension[],
  metricVariant: MetricVariant | null | undefined,
): TRAQIV2Dimension[] => {
  if (!isMetricVariantFanout(metricVariant)) {
    return [...breakdown];
  }
  const dimension = metricVariantKindToDimension(metricVariant.kind);
  if (breakdown.includes(dimension)) {
    return [...breakdown];
  }
  return [...breakdown, dimension];
};

export const serializeMetricVariantFanout = (
  metricVariant: MetricVariantFanout | null | undefined,
): string | null => (isMetricVariantFanout(metricVariant) ? metricVariant.kind : null);

export const deserializeMetricVariantFanout = (
  value: string | string[] | null | undefined,
): MetricVariantFanout | undefined => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 'percentile' || raw === 'aggregation') {
    return { mode: 'fanout', kind: raw };
  }
  return undefined;
};

export const hasMetricVariantFanout = (
  metricVariant: MetricVariant | null | undefined,
  breakdown?: readonly TRAQIV2Dimension[],
): boolean => {
  const { metricVariant: resolved } = splitMetricVariantFromBreakdown(metricVariant, breakdown);
  return isMetricVariantFanout(resolved);
};

/** True when a real dimension or a metric-variant fanout will split the series. */
export const hasChartBreakdown = (
  breakdown: readonly TRAQIV2Dimension[] | undefined,
  metricVariant?: MetricVariant | null,
): boolean => (breakdown?.length ?? 0) > 0 || hasMetricVariantFanout(metricVariant, breakdown);

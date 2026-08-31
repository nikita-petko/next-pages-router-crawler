import {
  RAQIV2AggregationType,
  RAQIV2Dimension,
  RAQIV2PercentileType,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import type { TQueryFilter } from '@modules/clients/analytics/analyticsRAQIShared';
import { isNumericUIMetric } from '@modules/experience-analytics-shared/constants/AnalyticsMetricDisplayConfig';
import type { AnalyticsSummaryCardConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedSummaryCardConfig';
import { isMetricTableColumnConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedTableColumnConfig';
import type { AnalyticsTableConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedTableConfig';
import type { ChartConfig } from '@modules/experience-analytics-shared/types/RAQIV2ChartConfig';
import type { CreatorAnalyticsUntabbedPageConfig } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { isRAQIV2SpecialLayoutConfig } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import type { SpecOverride } from '@modules/experience-analytics-shared/utils/computeRAQIV2SpecOverride';
import { withChartRows, withSummaryCards } from '../layout/dashboardLayout';
import { GRANULARITY_TO_TIME_INTERVAL } from '../synthesis/granularityMapping';
import {
  DEFAULT_CHART_GRANULARITY,
  DashboardPageMode,
  EMPTY_DASHBOARD_CONFIG,
  type ChartTileConfig,
  type CustomDashboardChartRow,
  type CustomDashboardConfig,
  type DashboardMetricReference,
  type DashboardMetricVariantSelection,
  type SummaryCardTileConfig,
} from '../types';
import { renderChartTypeToTileFields } from '../utils/chartTypeMapping';
import { createTileId } from '../utils/createTileId';
import { resolveDefaultChartAggregation } from '../utils/resolveDefaultChartAggregation';
import type { UnsupportedItemReport } from './unsupportedItemReport';

export type { UnsupportedItemReport } from './unsupportedItemReport';

export type AdapterResult = {
  readonly config: CustomDashboardConfig;
  /** Items the adapter dropped; the caller surfaces them in a banner. */
  readonly unsupported: ReadonlyArray<UnsupportedItemReport>;
};

/**
 * Narrows a rendered config's UI metric to a persistable tile `metricKey`.
 * Predefined configs can reference computed/custom-event shapes that custom
 * dashboards cannot persist as a simple tile metric; those return `null`.
 */
function toPersistedMetricKey(
  metric: string,
): ChartTileConfig['dataSpec']['metrics'][number]['metric']['metricKey'] | null {
  return isNumericUIMetric(metric) ? metric : null;
}

const RAQIV2_PERCENTILE_TYPES: ReadonlySet<string> = new Set(Object.values(RAQIV2PercentileType));
const RAQIV2_AGGREGATION_TYPES: ReadonlySet<string> = new Set(Object.values(RAQIV2AggregationType));
const RAQIV2_DIMENSION_VALUES: ReadonlySet<string> = new Set(Object.values(RAQIV2Dimension));

function isPercentileType(value: unknown): value is RAQIV2PercentileType {
  return typeof value === 'string' && RAQIV2_PERCENTILE_TYPES.has(value);
}

function isAggregationType(value: unknown): value is RAQIV2AggregationType {
  return typeof value === 'string' && RAQIV2_AGGREGATION_TYPES.has(value);
}

function isFilterOverride(
  value: unknown,
): value is { readonly override?: readonly unknown[]; readonly intersect?: readonly unknown[] } {
  return typeof value === 'object' && value !== null;
}

function isQueryFilter(value: unknown): value is TQueryFilter {
  return (
    typeof value === 'object' &&
    value !== null &&
    'dimension' in value &&
    typeof value.dimension === 'string' &&
    'values' in value &&
    Array.isArray(value.values)
  );
}

function getOverrideFilters(filterOverride: unknown): readonly TQueryFilter[] {
  if (!isFilterOverride(filterOverride)) {
    return [];
  }
  if (Array.isArray(filterOverride.override)) {
    return filterOverride.override.filter(isQueryFilter);
  }
  if (Array.isArray(filterOverride.intersect)) {
    return filterOverride.intersect.filter(isQueryFilter);
  }
  return [];
}

function getMetricVariantFromFilters(
  filters: readonly TQueryFilter[],
): ReadonlyArray<DashboardMetricVariantSelection> | undefined {
  const percentile = filters.find(
    (filter) => filter.dimension === RAQIV2UIPseudoDimension.PercentileType,
  )?.values[0];
  const aggregationType = filters.find(
    (filter) => filter.dimension === RAQIV2UIPseudoDimension.AggregationType,
  )?.values[0];
  if (!isPercentileType(percentile) && !isAggregationType(aggregationType)) {
    return undefined;
  }
  return [
    ...(isPercentileType(percentile)
      ? [{ pseudoDimensionKey: RAQIV2UIPseudoDimension.PercentileType, variantKey: percentile }]
      : []),
    ...(isAggregationType(aggregationType)
      ? [
          {
            pseudoDimensionKey: RAQIV2UIPseudoDimension.AggregationType,
            variantKey: aggregationType,
          },
        ]
      : []),
  ];
}

function getTileFilters(filters: readonly TQueryFilter[]): ChartTileConfig['dataSpec']['filters'] {
  return filters.flatMap((filter) =>
    RAQIV2_DIMENSION_VALUES.has(filter.dimension)
      ? [{ dimension: filter.dimension, values: filter.values.map(String) }]
      : [],
  );
}

function isSupportedComponent(
  c: unknown,
): c is ChartConfig | AnalyticsSummaryCardConfig | AnalyticsTableConfig {
  if (typeof c !== 'object' || c === null || !('type' in c)) {
    return false;
  }
  const { type } = c;
  return (
    type === AnalyticsComponentType.Chart ||
    type === AnalyticsComponentType.SummaryCard ||
    type === AnalyticsComponentType.Table
  );
}

function getFirstBreakdownDimension(
  breakdown: SpecOverride['breakdown'] | undefined,
): string | undefined {
  if (!breakdown) {
    return undefined;
  }
  if ('override' in breakdown && breakdown.override.length > 0) {
    return breakdown.override[0];
  }
  if ('intersect' in breakdown && breakdown.intersect.length > 0) {
    return breakdown.intersect[0];
  }
  return undefined;
}

function flattenBodyComponents(
  body: CreatorAnalyticsUntabbedPageConfig['body'],
): ReadonlyArray<ChartConfig | AnalyticsSummaryCardConfig | AnalyticsTableConfig> {
  // Recurses one level into special layouts; other shapes (tabbed,
  // benchmark groups, funnels) drop and surface as unsupported.
  return body.flatMap((component) => {
    if (isRAQIV2SpecialLayoutConfig(component)) {
      if ('items' in component && Array.isArray(component.items)) {
        return component.items.filter(isSupportedComponent);
      }
      return [];
    }
    if (isSupportedComponent(component)) {
      return [component];
    }
    return [];
  });
}

/**
 * Convert a predefined page's untabbed config into an authoring DTO. Output
 * is a starting point; unsupported items (tabbed, multi-metric, etc.)
 * are dropped and reported via `unsupported`.
 */
export function customDashboardConfigFromUntabbed(
  source: CreatorAnalyticsUntabbedPageConfig,
): AdapterResult {
  const unsupported: UnsupportedItemReport[] = [];
  const summaries: SummaryCardTileConfig[] = [];
  const charts: ChartTileConfig[] = [];

  const flat = flattenBodyComponents(source.body);
  if (flat.length === 0) {
    return { config: EMPTY_DASHBOARD_CONFIG, unsupported };
  }

  flat.forEach((item) => {
    if (item.type === AnalyticsComponentType.SummaryCard) {
      const summaryMetricKey = toPersistedMetricKey(item.metric);
      if (!summaryMetricKey) {
        unsupported.push({
          kind: 'unknown',
          entity: 'summary-card',
        });
        return;
      }
      summaries.push({
        tileId: createTileId(),
        type: 'SummaryCard',
        metric: {
          metricKey: summaryMetricKey,
          variantSelections: getMetricVariantFromFilters(
            getOverrideFilters(item.overrides?.filter),
          ),
        },
        aggregation: 'Total',
        filters: getTileFilters(getOverrideFilters(item.overrides?.filter)),
      });
      return;
    }
    if (item.type === AnalyticsComponentType.Table) {
      // TODO(DSA-6141): Preserve or report per-column overrides before Edit a copy ships.
      const tableMetrics = item.dataColumns.filter(isMetricTableColumnConfig).flatMap((column) => {
        if (typeof column.metric !== 'string') {
          return [];
        }
        const metricKey = toPersistedMetricKey(column.metric);
        if (!metricKey) {
          return [];
        }
        return [
          {
            metric: { metricKey } satisfies DashboardMetricReference,
            seriesKey: column.key,
          },
        ];
      });
      const [primaryTableMetric] = tableMetrics;
      if (!primaryTableMetric) {
        unsupported.push({
          kind: 'unsupported-chart-type',
          chartType: ChartType.Table,
        });
        return;
      }
      charts.push({
        tileId: createTileId(),
        type: 'Chart',
        dataSpec: {
          metrics: tableMetrics,
          aggregation: resolveDefaultChartAggregation(primaryTableMetric.metric),
          granularity: DEFAULT_CHART_GRANULARITY,
          ...(item.breakdowns.length > 0 ? { breakdownDimensions: [...item.breakdowns] } : {}),
          filters: [],
        },
        chartSpec: { chartType: ChartType.Table },
      });
      return;
    }
    if (item.type !== AnalyticsComponentType.Chart) {
      return;
    }
    if (!('metric' in item) || !item.metric) {
      unsupported.push({
        kind: 'multi-metric',
      });
      return;
    }
    const chartMetricKey = toPersistedMetricKey(item.metric);
    if (!chartMetricKey) {
      unsupported.push({
        kind: 'unknown',
        entity: 'chart',
      });
      return;
    }
    const chartFields = renderChartTypeToTileFields(item.chartType);
    if (!chartFields) {
      unsupported.push({
        kind: 'unsupported-chart-type',
        chartType: item.chartType,
      });
      return;
    }
    const granularityOverride = item.overrides?.granularity?.override;
    const breakdownDimension = getFirstBreakdownDimension(item.overrides?.breakdown);
    const chartMetricReference: DashboardMetricReference = {
      metricKey: chartMetricKey,
      variantSelections: getMetricVariantFromFilters(getOverrideFilters(item.overrides?.filter)),
    };
    charts.push({
      tileId: createTileId(),
      type: 'Chart',
      dataSpec: {
        metrics: [
          {
            metric: chartMetricReference,
            seriesKey: chartMetricKey,
          },
        ],
        aggregation: resolveDefaultChartAggregation(chartMetricReference),
        granularity:
          (granularityOverride !== undefined
            ? GRANULARITY_TO_TIME_INTERVAL[granularityOverride]
            : undefined) ?? DEFAULT_CHART_GRANULARITY,
        ...(breakdownDimension ? { breakdownDimensions: [breakdownDimension] } : {}),
        filters: getTileFilters(getOverrideFilters(item.overrides?.filter)),
      },
      chartSpec: chartFields,
    });
  });

  const body: CustomDashboardChartRow[] = charts.map((tile) => ({
    tiles: [tile],
    columnCount: 1,
  }));

  const config: CustomDashboardConfig = withChartRows(
    withSummaryCards(
      {
        page: {
          mode: DashboardPageMode.Untabbed,
          surface: {
            controls: {},
            bodyNodes: [],
          },
        },
      },
      summaries,
    ),
    body,
  );

  return { config, unsupported };
}

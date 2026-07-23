import type {
  RaqiQuery,
  MetricsSummaryInput,
  ResourceType,
  QueryBreakdown,
  QueryFilter,
} from '@rbx/client-universe-analytics-insights/v1';
import { MetricGranularity } from '@rbx/client-universe-analytics-insights/v1';
import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import type { RAQIV2Dimension, TRAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import type { ChartConfigOrPredefinedKey } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartConfig';
import { getMetricRelatedConfigFromPredefinedChart } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartConfig';
import type { AnalyticsSummaryCardConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedSummaryCardConfig';
import type { TabbedChartConfigOrPredefinedKey } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedTabbedChartConfig';
import { getTabbedConfigFromKeyOrConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedTabbedChartConfig';
import type { AnalyticsTabbedTableConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedTabbedTableConfigs';
import { isMetricTableColumnConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedTableColumnConfig';
import type { AnalyticsTableConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedTableConfig';
import { getAtomicMetricsFromMetricLike } from '@modules/experience-analytics-shared/types/ComputedMetric';
import type {
  CreatorAnalyticsPageConfig,
  RAQIV2UIComponent,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import type { SpecOverride } from '@modules/experience-analytics-shared/utils/computeRAQIV2SpecOverride';
import { getAPIMetricFromUIMetric } from '@modules/experience-analytics-shared/utils/getAPIMetricFromUIMetric';
import getCreatorAnalyticsPageSurfaceConfig from '@modules/experience-analytics-shared/utils/getCreatorAnalyticsPageSurfaceConfig';
import { getTypedUIOrLayoutComponent } from '@modules/experience-analytics-shared/utils/getTypedComponentKey';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';

/**
 * Extracts breakdown configuration from spec overrides
 */
function extractBreakdowns(overrides: SpecOverride): QueryBreakdown[] | undefined {
  if (!overrides.breakdown) {
    return undefined;
  }

  // Use 'override' or 'intersect' - both are treated the same
  // since there's no page-level breakdown to merge with
  const dimensions =
    'override' in overrides.breakdown
      ? overrides.breakdown.override
      : overrides.breakdown.intersect;

  return dimensions.map((dim) => ({
    dimensions: [dim],
  }));
}

/**
 * Extracts filter configuration from spec overrides
 */
function extractFilters(overrides: SpecOverride): QueryFilter[] | undefined {
  if (!overrides.filter) {
    return undefined;
  }

  // Use 'override' or 'intersect' - both are treated the same
  const filters =
    'override' in overrides.filter ? overrides.filter.override : overrides.filter.intersect;

  return filters.map((f) => ({
    dimension: f.dimension,
    values: f.values,
    // Only include operation if it exists (not on UI filters)
    ...('operation' in f && f.operation !== undefined ? { operation: f.operation } : {}),
  }));
}

/**
 * Extracts limit configuration from spec overrides
 */
function extractLimit(overrides: SpecOverride): number | undefined {
  return overrides.limit?.override;
}

/**
 * Core function: converts UI metric + overrides to RaqiQuery[]
 * A single UI metric may map to multiple API metrics
 */
function buildQueriesFromMetricAndOverrides(
  uiMetric: TRAQIV2UIMetric,
  overrides: SpecOverride,
  resourceType: ResourceType,
  resourceId: string,
  startUtcTime: string,
  endUtcTime: string,
): RaqiQuery[] {
  // Use the helper to get API metrics from UI metric
  let apiMetrics: string | string[];

  if (isValidEnumValue(RAQIV2Metric, uiMetric)) {
    apiMetrics = uiMetric;
  } else {
    apiMetrics = getAPIMetricFromUIMetric(uiMetric, {
      percentile: null,
      aggregationType: null,
    });
  }

  // Handle array or single metric
  const metricArray: string[] = Array.isArray(apiMetrics) ? apiMetrics : [apiMetrics];

  // Build query for each API metric
  const queries: RaqiQuery[] = metricArray.map((apiMetric: string) => {
    const query: RaqiQuery = {
      resourceType,
      resourceId,
      metric: apiMetric,
      granularity: MetricGranularity.OneDay, // Default to daily
      startTime: startUtcTime,
      endTime: endUtcTime,
    };

    // Add breakdown if specified in overrides
    const breakdown = extractBreakdowns(overrides);
    if (breakdown) {
      query.breakdown = breakdown;
    }

    // Add filters if specified in overrides
    const filter = extractFilters(overrides);
    if (filter) {
      query.filter = filter;
    }

    // Add limit if specified in overrides
    const limit = extractLimit(overrides);
    if (limit !== undefined) {
      query.limit = limit;
    }

    return query;
  });

  return queries;
}

/**
 * Builds queries from a Chart component
 */
function buildQueriesFromChart(
  keyOrConfig: ChartConfigOrPredefinedKey,
  resourceType: ResourceType,
  resourceId: string,
  startUtcTime: string,
  endUtcTime: string,
): RaqiQuery[] {
  const metricConfigs = getMetricRelatedConfigFromPredefinedChart(keyOrConfig);

  return metricConfigs.flatMap((mc) =>
    buildQueriesFromMetricAndOverrides(
      mc.metric,
      mc.overrides,
      resourceType,
      resourceId,
      startUtcTime,
      endUtcTime,
    ),
  );
}

/**
 * Builds queries from a TabbedChart component
 */
function buildQueriesFromTabbedChart(
  keyOrConfig: TabbedChartConfigOrPredefinedKey,
  resourceType: ResourceType,
  resourceId: string,
  startUtcTime: string,
  endUtcTime: string,
): RaqiQuery[] {
  const config = getTabbedConfigFromKeyOrConfig(keyOrConfig);

  return config.tabs.flatMap((tab) =>
    buildQueriesFromChart(tab.chart, resourceType, resourceId, startUtcTime, endUtcTime),
  );
}

/**
 * Builds queries from a Table component
 */
function buildQueriesFromTable(
  config: AnalyticsTableConfig,
  resourceType: ResourceType,
  resourceId: string,
  startUtcTime: string,
  endUtcTime: string,
): RaqiQuery[] {
  const metricColumns = config.dataColumns.filter(isMetricTableColumnConfig);

  return metricColumns.flatMap((col) => {
    // Computed metrics fan out into one query per atomic source so the assistant
    // sees the underlying inputs that drive the formula. Atomic columns are
    // returned as a single-element list by `getAtomicMetricsFromMetricLike`.
    const atomicMetrics = getAtomicMetricsFromMetricLike(col.metric);
    return atomicMetrics.flatMap((atomicMetric) =>
      buildQueriesFromMetricAndOverrides(
        atomicMetric,
        col.overrides ?? {},
        resourceType,
        resourceId,
        startUtcTime,
        endUtcTime,
      ),
    );
  });
}

/**
 * Builds queries from a SummaryCard component
 */
function buildQueriesFromSummaryCard(
  config: AnalyticsSummaryCardConfig,
  resourceType: ResourceType,
  resourceId: string,
  startUtcTime: string,
  endUtcTime: string,
): RaqiQuery[] {
  return buildQueriesFromMetricAndOverrides(
    config.metric,
    config.overrides,
    resourceType,
    resourceId,
    startUtcTime,
    endUtcTime,
  );
}

/**
 * Builds queries from a TabbedTable component
 */
function buildQueriesFromTabbedTable(
  config: AnalyticsTabbedTableConfig,
  resourceType: ResourceType,
  resourceId: string,
  startUtcTime: string,
  endUtcTime: string,
): RaqiQuery[] {
  return config.tabs.flatMap((tab) =>
    buildQueriesFromTable(tab.config, resourceType, resourceId, startUtcTime, endUtcTime),
  );
}

/**
 * Recursively builds queries from a component
 * Handles both regular components and layout configurations
 */
function buildQueriesFromComponent(
  component: RAQIV2UIComponent,
  resourceType: ResourceType,
  resourceId: string,
  startUtcTime: string,
  endUtcTime: string,
): RaqiQuery[] {
  const typedComponent = getTypedUIOrLayoutComponent(component);
  const { type } = typedComponent;

  switch (type) {
    case AnalyticsComponentType.Chart: {
      const { keyOrConfig } = typedComponent;
      return buildQueriesFromChart(keyOrConfig, resourceType, resourceId, startUtcTime, endUtcTime);
    }
    case AnalyticsComponentType.TabbedChart: {
      const { keyOrConfig } = typedComponent;
      return buildQueriesFromTabbedChart(
        keyOrConfig,
        resourceType,
        resourceId,
        startUtcTime,
        endUtcTime,
      );
    }
    case AnalyticsComponentType.Table: {
      const { config } = typedComponent;
      return buildQueriesFromTable(config, resourceType, resourceId, startUtcTime, endUtcTime);
    }
    case AnalyticsComponentType.SummaryCard: {
      const { config } = typedComponent;
      return buildQueriesFromSummaryCard(
        config,
        resourceType,
        resourceId,
        startUtcTime,
        endUtcTime,
      );
    }
    case AnalyticsComponentType.TabbedTable: {
      const { config } = typedComponent;
      return buildQueriesFromTabbedTable(
        config,
        resourceType,
        resourceId,
        startUtcTime,
        endUtcTime,
      );
    }
    case AnalyticsComponentType.Layout: {
      const { config } = typedComponent;
      const { type: layoutType } = config;

      switch (layoutType) {
        case RAQIV2SpecialLayoutType.VerticalPriorityLayout: {
          const { firstColumn, secondColumn } = config;
          return [...firstColumn, ...secondColumn].flatMap((item) =>
            buildQueriesFromComponent(item, resourceType, resourceId, startUtcTime, endUtcTime),
          );
        }
        case RAQIV2SpecialLayoutType.RowLayout:
        case RAQIV2SpecialLayoutType.TwoPerRowLayout:
        case RAQIV2SpecialLayoutType.FullWidthLayout: {
          const { items } = config;
          return items.flatMap((item) =>
            buildQueriesFromComponent(item, resourceType, resourceId, startUtcTime, endUtcTime),
          );
        }
        case RAQIV2SpecialLayoutType.DropdownSelectorLayout: {
          const { items } = config;
          return items.flatMap((item) =>
            buildQueriesFromComponent(
              item.value,
              resourceType,
              resourceId,
              startUtcTime,
              endUtcTime,
            ),
          );
        }
        case RAQIV2SpecialLayoutType.SectionTitle:
          // Skip section titles - no metrics
          return [];
        default: {
          const exhaustiveCheck: never = layoutType;
          throw new Error(`Unhandled layout type: ${String(exhaustiveCheck)}`);
        }
      }
    }
    case AnalyticsComponentType.ControlledSubcontext: {
      const { config } = typedComponent;
      return buildQueriesFromComponent(
        config.body,
        resourceType,
        resourceId,
        startUtcTime,
        endUtcTime,
      );
    }
    case AnalyticsComponentType.NonGeneric:
      // Skip ArbitraryComponentConfig / NonGeneric components
      return [];
    default: {
      const exhaustiveCheck: never = type;
      throw new Error(`Unhandled component type: ${String(exhaustiveCheck)}`);
    }
  }
}

/**
 * Deduplicates queries by comparing their JSON stringified representations
 */
function deduplicateQueries(queries: RaqiQuery[]): RaqiQuery[] {
  const seen = new Set<string>();
  const dedupedQueries: RaqiQuery[] = [];

  queries.forEach((query) => {
    const key = JSON.stringify(query);
    if (!seen.has(key)) {
      seen.add(key);
      dedupedQueries.push(query);
    }
  });

  return dedupedQueries;
}

/**
 * Builds MetricsSummaryInput from a page configuration
 */
function buildMetricsSummaryInput<
  TTab extends string,
  TDim extends RAQIV2Dimension,
  TDimValues extends string,
>(
  config: CreatorAnalyticsPageConfig<TTab, TDim, TDimValues>,
  pageKey: string,
  startDate: Date,
  endDate: Date,
  resourceType: ResourceType,
  resourceId: string,
): MetricsSummaryInput {
  const startUtcTime = startDate.toISOString();
  const endUtcTime = endDate.toISOString();

  const surfaceConfig = getCreatorAnalyticsPageSurfaceConfig(config);

  const allQueries = surfaceConfig.body.flatMap((component) =>
    buildQueriesFromComponent(component, resourceType, resourceId, startUtcTime, endUtcTime),
  );

  const queries = deduplicateQueries(allQueries);

  return {
    startUtcTime,
    endUtcTime,
    queries,
    pageKey,
  } satisfies MetricsSummaryInput;
}

export default buildMetricsSummaryInput;

// The following functions are exported solely for testing purposes
export {
  extractBreakdowns,
  extractFilters,
  extractLimit,
  buildQueriesFromMetricAndOverrides,
  buildQueriesFromChart,
  buildQueriesFromTabbedChart,
  buildQueriesFromTable,
  buildQueriesFromSummaryCard,
  buildQueriesFromTabbedTable,
  deduplicateQueries,
};

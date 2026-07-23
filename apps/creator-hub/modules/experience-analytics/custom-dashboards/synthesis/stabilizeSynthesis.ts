import type { AnalyticsSummaryCardConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedSummaryCardConfig';
import type { AnalyticsTableConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedTableConfig';
import type { ChartConfig } from '@modules/experience-analytics-shared/types/RAQIV2ChartConfig';
import { getChartRows, getSummaryCards } from '../layout/dashboardLayout';
import type {
  ChartTileConfig,
  CustomDashboardConfig,
  SummaryCardTileConfig,
  TileId,
} from '../types';
import type {
  SynthesizedChartEntry,
  SynthesizedSummaryEntry,
  SynthesizeResult,
} from './synthesize';

function tileConfigFingerprint(tile: SummaryCardTileConfig | ChartTileConfig): string {
  return JSON.stringify(tile);
}

function valueFingerprint(value: unknown): string {
  return JSON.stringify(value);
}

function reuseValueIfEqual<T>(previous: T, next: T): T {
  return valueFingerprint(previous) === valueFingerprint(next) ? previous : next;
}

function chartTileById(config: CustomDashboardConfig): Map<TileId, ChartTileConfig> {
  const byId = new Map<TileId, ChartTileConfig>();
  getChartRows(config).forEach((row) => {
    row.tiles.forEach((tile) => {
      byId.set(tile.tileId, tile);
    });
  });
  return byId;
}

function summaryTileById(config: CustomDashboardConfig): Map<TileId, SummaryCardTileConfig> {
  return new Map(getSummaryCards(config).map((tile) => [tile.tileId, tile]));
}

function reuseChartComponent(
  tileId: TileId,
  component: ChartConfig | AnalyticsTableConfig,
  prevChartsByTileId: Map<TileId, ChartConfig | AnalyticsTableConfig>,
  prevChartTilesById: Map<TileId, ChartTileConfig>,
  nextChartTilesById: Map<TileId, ChartTileConfig>,
): ChartConfig | AnalyticsTableConfig {
  const prevTile = prevChartTilesById.get(tileId);
  const nextTile = nextChartTilesById.get(tileId);
  if (!prevTile || !nextTile) {
    return component;
  }
  if (tileConfigFingerprint(prevTile) !== tileConfigFingerprint(nextTile)) {
    return component;
  }
  return prevChartsByTileId.get(tileId) ?? component;
}

function reuseChartEntry(
  entry: SynthesizedChartEntry,
  prevEntriesByTileId: Map<TileId, SynthesizedChartEntry>,
  prevComponentsByTileId: Map<TileId, ChartConfig | AnalyticsTableConfig>,
  prevChartTilesById: Map<TileId, ChartTileConfig>,
  nextChartTilesById: Map<TileId, ChartTileConfig>,
): SynthesizedChartEntry {
  const component = reuseChartComponent(
    entry.tileId,
    entry.component,
    prevComponentsByTileId,
    prevChartTilesById,
    nextChartTilesById,
  );
  const previousEntry = prevEntriesByTileId.get(entry.tileId);
  return previousEntry && previousEntry.component === component
    ? previousEntry
    : { ...entry, component };
}

function reuseSummaryComponent(
  tileId: TileId,
  component: AnalyticsSummaryCardConfig,
  prevSummariesByTileId: Map<TileId, AnalyticsSummaryCardConfig>,
  prevSummaryTilesById: Map<TileId, SummaryCardTileConfig>,
  nextSummaryTilesById: Map<TileId, SummaryCardTileConfig>,
): AnalyticsSummaryCardConfig {
  const prevTile = prevSummaryTilesById.get(tileId);
  const nextTile = nextSummaryTilesById.get(tileId);
  if (!prevTile || !nextTile) {
    return component;
  }
  if (tileConfigFingerprint(prevTile) !== tileConfigFingerprint(nextTile)) {
    return component;
  }
  return prevSummariesByTileId.get(tileId) ?? component;
}

function reuseSummaryEntry(
  entry: SynthesizedSummaryEntry,
  prevEntriesByTileId: Map<TileId, SynthesizedSummaryEntry>,
  prevComponentsByTileId: Map<TileId, AnalyticsSummaryCardConfig>,
  prevSummaryTilesById: Map<TileId, SummaryCardTileConfig>,
  nextSummaryTilesById: Map<TileId, SummaryCardTileConfig>,
): SynthesizedSummaryEntry {
  const component = reuseSummaryComponent(
    entry.tileId,
    entry.component,
    prevComponentsByTileId,
    prevSummaryTilesById,
    nextSummaryTilesById,
  );
  const previousEntry = prevEntriesByTileId.get(entry.tileId);
  return previousEntry && previousEntry.component === component
    ? previousEntry
    : { ...entry, component };
}

function getRowKey(row: ReadonlyArray<SynthesizedChartEntry>): string {
  return row.map((entry) => entry.tileId).join('\u0000');
}

function reuseChartRow(
  row: ReadonlyArray<SynthesizedChartEntry>,
  prevRowsByKey: Map<string, ReadonlyArray<SynthesizedChartEntry>>,
): ReadonlyArray<SynthesizedChartEntry> {
  const previousRow = prevRowsByKey.get(getRowKey(row));
  if (
    previousRow &&
    previousRow.length === row.length &&
    previousRow.every((previousEntry, index) => previousEntry === row[index])
  ) {
    return previousRow;
  }
  return row;
}

function stabilizePageConfig(
  prevResult: SynthesizeResult,
  nextResult: SynthesizeResult,
): SynthesizeResult['pageConfig'] {
  const previous = prevResult.pageConfig;
  const next = nextResult.pageConfig;
  return {
    ...next,
    description: reuseValueIfEqual(previous.description, next.description),
    docLinks: reuseValueIfEqual(previous.docLinks, next.docLinks),
    resourceTypes: reuseValueIfEqual(previous.resourceTypes, next.resourceTypes),
    timeRangeOptions: reuseValueIfEqual(previous.timeRangeOptions, next.timeRangeOptions),
    defaultDateRangeSelection: reuseValueIfEqual(
      previous.defaultDateRangeSelection,
      next.defaultDateRangeSelection,
    ),
    surfaceAnnotationOptions: reuseValueIfEqual(
      previous.surfaceAnnotationOptions,
      next.surfaceAnnotationOptions,
    ),
    filterDimensions: reuseValueIfEqual(previous.filterDimensions, next.filterDimensions),
    defaultFilters: reuseValueIfEqual(previous.defaultFilters, next.defaultFilters),
    breakdownDimensions: reuseValueIfEqual(previous.breakdownDimensions, next.breakdownDimensions),
    defaultBreakdown: reuseValueIfEqual(previous.defaultBreakdown, next.defaultBreakdown),
    granularity: reuseValueIfEqual(previous.granularity, next.granularity),
    // Keep a stable `body` identity across renders when the rendered layout is
    // unchanged so body consumers (and their children) don't needlessly
    // re-render when an unrelated part of the config changes (Finding #17).
    body: reuseValueIfEqual(previous.body, next.body),
  };
}

/**
 * Reuses prior synthesized chart/summary component object identities when a tile's
 * authoring config is unchanged. Prevents unrelated tiles from remounting when one
 * tile is removed or the dashboard layout is rearranged.
 */
export function stabilizeSynthesisResult(
  prevConfig: CustomDashboardConfig,
  prevResult: SynthesizeResult,
  nextConfig: CustomDashboardConfig,
  nextResult: SynthesizeResult,
): SynthesizeResult {
  const prevSummaryTilesById = summaryTileById(prevConfig);
  const nextSummaryTilesById = summaryTileById(nextConfig);
  const prevChartTilesById = chartTileById(prevConfig);
  const nextChartTilesById = chartTileById(nextConfig);

  const prevSummaryEntriesByTileId = new Map(
    prevResult.summaries.map((entry) => [entry.tileId, entry]),
  );
  const prevChartEntriesByTileId = new Map(
    prevResult.chartRows.flat().map((entry) => [entry.tileId, entry]),
  );
  const prevChartRowsByKey = new Map(prevResult.chartRows.map((row) => [getRowKey(row), row]));

  // Build the tileId → previous-component lookups once. Constructing them inside
  // the per-entry reuse helpers made stabilization O(n^2) in the tile count.
  const prevSummaryComponentsByTileId = new Map(
    Array.from(prevSummaryEntriesByTileId, ([tileId, prevEntry]) => [tileId, prevEntry.component]),
  );
  const prevChartComponentsByTileId = new Map(
    Array.from(prevChartEntriesByTileId, ([tileId, prevEntry]) => [tileId, prevEntry.component]),
  );

  const summaries: SynthesizedSummaryEntry[] = nextResult.summaries.map((entry) =>
    reuseSummaryEntry(
      entry,
      prevSummaryEntriesByTileId,
      prevSummaryComponentsByTileId,
      prevSummaryTilesById,
      nextSummaryTilesById,
    ),
  );

  const chartRows: ReadonlyArray<ReadonlyArray<SynthesizedChartEntry>> = nextResult.chartRows.map(
    (row) =>
      reuseChartRow(
        row.map((entry) =>
          reuseChartEntry(
            entry,
            prevChartEntriesByTileId,
            prevChartComponentsByTileId,
            prevChartTilesById,
            nextChartTilesById,
          ),
        ),
        prevChartRowsByKey,
      ),
  );

  return {
    ...nextResult,
    pageConfig: stabilizePageConfig(prevResult, nextResult),
    summaries,
    chartRows,
  };
}

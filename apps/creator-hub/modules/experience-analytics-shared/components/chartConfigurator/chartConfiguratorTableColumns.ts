import type { RAQIV2QueryFilter } from '@modules/clients/analytics';
import type { TChartConfiguratorMetrics } from '../../chartConfigurator/chartConfiguratorMetricsConfig';
import type { ComputedMetric } from '../../types/ComputedMetric';

/**
 * Additional metric column added by the user beyond the primary metric column
 * in explore mode's table view. Each column corresponds to a single column in
 * the rendered table.
 */
export type ExploreModeTableMetricColumn = {
  type: 'metric';
  key: string;
  metric: TChartConfiguratorMetrics | null;
  filters?: readonly RAQIV2QueryFilter[];
};

export type ExploreModeTableComputedColumn = {
  type: 'computed';
  key: string;
  computedMetric: ComputedMetric | null;
};

export type ExploreModeTableColumn = ExploreModeTableMetricColumn | ExploreModeTableComputedColumn;

/** Maximum total number of metric columns in a table (primary + additional). */
export const MAX_TABLE_METRIC_COLUMNS = 8;

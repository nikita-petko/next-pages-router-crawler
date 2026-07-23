import type { TRAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import type {
  TableColumnConfig,
  ColumnType,
} from '@modules/charts-generic/tables/types/GenericColumnType';
import type { TableSortOrder } from '@modules/charts-generic/tables/types/TableSort';
import type { AnalyticsQueryGatewayAPIBreakdownValue as RAQIV2BreakdownValue } from '@modules/clients/analytics/analyticsQueryGateway';
import type { RAQIV2TableRowID } from '../adapters/genericRAQIV2TableAdapter';
import type {
  RowDataResponse,
  PaginatedColumnRequest,
} from '../components/RAQIV2/table/GenericDataTable';
import type { PaginationResponse } from '../hooks/usePaginatedRequest';
import type { MetricLike } from '../types/ComputedMetric';
import type { SpecOverride } from '../utils/computeRAQIV2SpecOverride';

type TableSortConfig = {
  direction?: TableSortOrder;
  isFixedOrder?: boolean;
  isServerSideSorting?: boolean;
  hideSortIcon?: boolean;
};

export type TAnalyticsMetricTableColumnConfig = {
  key: string; // Historically RAQIV2PredefinedTableColumnKey, now you must make sure your keys are unique among column configs
  metric: MetricLike<TRAQIV2UIMetric>;
  overrides?: SpecOverride;
  isComparisonDataShown?: boolean;
  sort?: TableSortConfig;
  /**
   * Optional explicit display title for the column header. When unset, the
   * renderer falls back to `getMetricTitleKeyFromMetricLike(metric)` (atomic
   * metric label, computed-metric name, or "(Untitled formula)" for an
   * unnamed computed metric — never the raw formula text).
   */
  titleOverride?: string;
};

type CustomDataTypeByColumnType<TColumnType extends ColumnType> = {
  columnType: TColumnType;
  // see docs: apps/creator-hub/modules/experience-analytics-shared/docs/TABLE_CONFIGS.md#getdata-contract
  getData: (
    request: PaginatedColumnRequest<RAQIV2BreakdownValue[], RAQIV2TableRowID, string>,
  ) => Promise<PaginationResponse<RowDataResponse<RAQIV2BreakdownValue[], RAQIV2TableRowID>>>;
  sort?: Omit<TableSortConfig, 'direction'> & Required<Pick<TableSortConfig, 'direction'>>;
};

export type TAnalyticsCustomTableColumnConfig = {
  key: string;
} & Omit<TableColumnConfig<string>, 'columnType' | 'columnKey' | 'sort'> &
  CustomDataTypeByColumnType<ColumnType>;

export type TRAQIV2PredefinedTableColumnConfig =
  | TAnalyticsMetricTableColumnConfig
  | TAnalyticsCustomTableColumnConfig;

export const isCustomTableColumnConfig = (
  config: TRAQIV2PredefinedTableColumnConfig,
): config is TAnalyticsCustomTableColumnConfig => {
  return !('metric' in config);
};

export const isMetricTableColumnConfig = (
  config: TRAQIV2PredefinedTableColumnConfig,
): config is TAnalyticsMetricTableColumnConfig => {
  return !isCustomTableColumnConfig(config);
};

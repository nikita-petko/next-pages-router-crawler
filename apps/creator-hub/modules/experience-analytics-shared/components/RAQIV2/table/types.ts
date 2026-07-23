import type { RAQIV2ChartResource } from '@modules/clients/analytics';
import type {
  TAnalyticsCustomTableColumnConfig,
  TAnalyticsMetricTableColumnConfig,
} from '../../../constants/RAQIV2PredefinedTableColumnConfig';
import type RAQIV2TableColumnSpec from '../../../types/RAQIV2TableColumnSpec';

export type CustomTableColumnSpec<TColumnKey> = Omit<TAnalyticsCustomTableColumnConfig, 'key'> & {
  columnKey: TColumnKey;
  resource: RAQIV2ChartResource;
};

export type MetricTableColumnSpec<TColumnKey> = RAQIV2TableColumnSpec &
  Omit<TAnalyticsMetricTableColumnConfig, 'key' | 'metric' | 'overrides'> & {
    columnKey: TColumnKey;
  };

export type TableColumnSpec<TColumnKey> =
  | MetricTableColumnSpec<TColumnKey>
  | CustomTableColumnSpec<TColumnKey>;

export const isRAQIV2TableColumnSpec = <TColumnKey>(
  spec: TableColumnSpec<TColumnKey>,
): spec is MetricTableColumnSpec<TColumnKey> => {
  return 'metric' in spec;
};

export type TablePaginationSpec = {
  initialPageSize?: number;
  pageSizeOptions?: number[];
} | null;

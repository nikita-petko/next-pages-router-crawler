import { RAQIV2ChartResource } from '@modules/clients/analytics';
import RAQIV2TableColumnSpec from '../../../types/RAQIV2TableColumnSpec';
import {
  TAnalyticsCustomTableColumnConfig,
  TAnalyticsMetricTableColumnConfig,
} from '../../../constants/RAQIV2PredefinedTableColumnConfig';

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

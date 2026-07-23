import { ColumnType, TableSortOrder } from '@modules/charts-generic';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';

export type RAQIV2DimensionTableColumnConfig = {
  columnType: ColumnType;
  sort?: {
    direction: TableSortOrder;
  };
  widthWeight?: number;
};

const RAQIV2DimensionTableConfig: Partial<Record<string, RAQIV2DimensionTableColumnConfig>> = {
  [RAQIV2Dimension.AcquisitionSource]: { columnType: ColumnType.TextWithTooltip },
  [RAQIV2Dimension.FunnelStep]: {
    columnType: ColumnType.TextWithDisplayValue,
    sort: { direction: TableSortOrder.asc },
    widthWeight: 18,
  },
  [RAQIV2Dimension.Universe]: {
    columnType: ColumnType.TextWithDisplayValue,
  },
  [RAQIV2Dimension.StartTimeUTC]: {
    columnType: ColumnType.Date,
    sort: { direction: TableSortOrder.desc },
  },
  [RAQIV2Dimension.EndTimeUTC]: {
    columnType: ColumnType.Date,
    sort: { direction: TableSortOrder.desc },
  },
  [RAQIV2Dimension.EventCategory]: {
    columnType: ColumnType.Text,
    sort: { direction: TableSortOrder.asc },
  },
  [RAQIV2Dimension.VirtualEventId]: {
    columnType: ColumnType.Text,
    sort: { direction: TableSortOrder.asc },
  },
};
export default RAQIV2DimensionTableConfig;

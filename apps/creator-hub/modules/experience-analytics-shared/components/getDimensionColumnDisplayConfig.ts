import { ColumnType, TableColumnConfig } from '@modules/charts-generic';
import { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import getDimensionRenderer from './getDimensionRenderer';
import RAQIV2DimensionTableConfig from '../metric-definitions-bundle/RAQIV2DimensionTableColumnConfig';

const getDefaultColumnDimensionDisplayConfig = (dimension: TRAQIV2Dimension) => {
  const dimensionColumnConfig: TableColumnConfig<TRAQIV2Dimension> = {
    columnKey: dimension,
    columnType: ColumnType.Text,
    titleKey: getDimensionRenderer(dimension).name,
  };
  return dimensionColumnConfig;
};

const getDimensionColumnDisplayConfig = (
  dimension: TRAQIV2Dimension,
): TableColumnConfig<TRAQIV2Dimension> => {
  const tableColumnConfig = RAQIV2DimensionTableConfig[dimension];
  return {
    ...getDefaultColumnDimensionDisplayConfig(dimension),
    ...(tableColumnConfig || {}),
  };
};

export default getDimensionColumnDisplayConfig;

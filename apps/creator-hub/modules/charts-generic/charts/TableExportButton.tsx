import { useMemo } from 'react';
import type { FormattedText } from '@modules/analytics-translations/types';
import type { TableColumnConfig } from '../tables/types/GenericColumnType';
import type { CellDataType } from '../tables/types/GenericTableType';
import GenericTableExporter from './exporters/GenericTableExporter';
import type { TGenericChartExportConfig } from './GenericChartExportButton';
import GenericChartExportButton from './GenericChartExportButton';

type GenericTableRowData<TKey extends string | number> = Map<TKey, CellDataType>[];

export type TableExportButtonProps<TKey extends string | number> = {
  telemetryContext: { kpiType: string };
  columns: Array<TKey>;
  columnConfigs: TableColumnConfig<TKey>[];
  columnNames: Map<TKey, FormattedText>;
  fileName: string;
  rowData: GenericTableRowData<TKey>;
  exportButtonConfig?: TGenericChartExportConfig;
};

const TableExportButton = <TKey extends string | number>({
  telemetryContext,
  columns,
  columnConfigs,
  columnNames,
  fileName,
  rowData,
  exportButtonConfig,
}: TableExportButtonProps<TKey>) => {
  const exporter = useMemo(() => {
    return new GenericTableExporter(columns, columnConfigs, columnNames, rowData, fileName);
  }, [columnConfigs, columnNames, columns, fileName, rowData]);

  return exporter.hasEmptyData ? null : (
    <GenericChartExportButton
      kpiType={telemetryContext.kpiType}
      exporter={exporter}
      exportButtonConfig={exportButtonConfig}
    />
  );
};
export default TableExportButton;

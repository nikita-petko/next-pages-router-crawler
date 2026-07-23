import React, { useMemo } from 'react';
import { FormattedText } from '@modules/analytics-translations';
import GenericChartExportButton, { TGenericChartExportConfig } from './GenericChartExportButton';
import { CellDataType } from '../tables/types/GenericTableType';
import { TableColumnConfig } from '../tables/types/GenericColumnType';
import GenericTableExporter from './exporters/GenericTableExporter';

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

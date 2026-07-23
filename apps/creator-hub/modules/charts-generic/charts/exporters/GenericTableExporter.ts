import { compileCSV, CSVData } from '@rbx/core';
import { FormattedText } from '@modules/analytics-translations';
import { CellDataType } from '../../tables/types/GenericTableType';
import GenericCsvExporter, { escapeFileName } from './GenericCsvExporter';
import { ColumnType, TableColumnConfig } from '../../tables/types/GenericColumnType';

type GenericTableRowData<TKey extends string | number> = Map<TKey, CellDataType>[];

class GenericTableExporter<TKey extends string | number> extends GenericCsvExporter {
  constructor(
    protected readonly columnKeys: TKey[],
    protected readonly columnConfigs: TableColumnConfig<TKey>[],
    protected readonly columnNames: Map<TKey, FormattedText>,
    protected readonly rowData: GenericTableRowData<TKey>,
    protected readonly fileName?: string,
  ) {
    super();
  }

  private getRowData() {
    return this.rowData.map((row) => {
      const newRow = new Map();
      row.forEach((cellValue, key) => {
        const { type } = cellValue;
        switch (type) {
          case ColumnType.BoldText:
          case ColumnType.Text:
          case ColumnType.Timestamp:
          case ColumnType.RawJSONString:
          case ColumnType.Number:
            newRow.set(key, cellValue.value);
            break;
          case ColumnType.TextWithTooltip: {
            newRow.set(key, cellValue.text);
            break;
          }
          case ColumnType.TextWithDisplayValue: {
            newRow.set(key, cellValue.displayValue ?? cellValue.value);
            break;
          }
          case ColumnType.TextWithLink: {
            newRow.set(key, cellValue.text);
            break;
          }
          case ColumnType.Selection: {
            newRow.set(key, !!cellValue.checked);
            break;
          }
          case ColumnType.Status: {
            newRow.set(key, cellValue.label);
            break;
          }
          case ColumnType.Image: {
            newRow.set(
              key,
              cellValue.text ||
                cellValue.description ||
                cellValue.src ||
                cellValue.displayTextForSummaryRow,
            );
            break;
          }
          case ColumnType.Date: {
            newRow.set(key, cellValue.value.toISOString());
            break;
          }
          case ColumnType.Actions:
          case ColumnType.Other:
            break;
          case ColumnType.TextWithIcon: {
            const tooltipSuffix = cellValue.tooltip ? ` (${cellValue.tooltip.message})` : '';
            newRow.set(key, `${cellValue.value}${tooltipSuffix}`);
            break;
          }
          case ColumnType.Code: {
            const tooltipSuffix = cellValue.tooltip ? ` (${cellValue.tooltip.message})` : '';
            newRow.set(key, `${cellValue.value}${tooltipSuffix}`);
            break;
          }
          case ColumnType.CodeDiff: {
            newRow.set(key, `${cellValue.original}\n${cellValue.modified}`);
            break;
          }
          default: {
            const exhaustiveCheck: never = type;
            throw new Error(`Unhandled column type: ${exhaustiveCheck}`);
          }
        }
      });
      return newRow;
    });
  }

  protected generateCSV(): CSVData {
    const lines: string[][] = [];

    lines.push(this.columnKeys.map((column) => this.columnNames.get(column) ?? `${column}`));

    this.getRowData().forEach((row) => {
      lines.push(this.columnKeys.map((column) => row.get(column)?.toString() ?? ''));
    });

    return compileCSV(lines);
  }

  protected getExportFilename(): string {
    return this.fileName
      ? `${escapeFileName(this.fileName)}.csv`
      : `${new Date().toISOString()}.csv`;
  }

  get hasEmptyData(): boolean {
    return !this.rowData.length;
  }
}

export default GenericTableExporter;

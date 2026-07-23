import { useCallback, useEffect, useMemo, useState } from 'react';
import { withTranslation } from '@rbx/intl';
import { getCurrentYear } from '@rbx/core';
import { translationKey } from '@modules/analytics-translations';
import {
  CellDataType,
  CodeEditorSupportedLanguages,
  ColumnType,
  GenericTableV2,
  getComparator,
  logAnalyticsError,
  TableSortOrder,
  type GenericTableV2ExpandedRowCellSpec,
  type GenericTableV2ExpandedRowColumnsByColumn,
  type TableColumnConfig,
  type GenericChartState,
} from '@modules/charts-generic';
import { useRAQIV2TranslationDependencies } from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  SortKey,
  SortOrder,
  ValidConfigEntryValueType,
} from '../../api/universeConfigsClientEnums';
import { ValidConfigEntryValue } from '../../api/validTypes';
import { configEntryToStringValueForTable } from '../../utils/configEntryToStringValue';
import prettyPrintJson from '../../utils/prettyPrintJson';
import { HistoryTableParentColumn, orderedParentColumnConfigs } from './historyTableColumns';
import { useSearchKey } from './SearchKeyContext';
import type { OffsetBasedPaginationState } from '../../hooks/useOffsetBasedPaginationState';
import type { ValidChangelogEntry, ValidSortKey, ValidSortOrder } from '../../api/validTypes';
import { UsernameDecoratedChangelogEntry } from './types';

type HistoryTableProps = GenericChartState & {
  changelogEntries: UsernameDecoratedChangelogEntry[];
  sort: {
    key: ValidSortKey;
    order: ValidSortOrder;
    onChange: (key: ValidSortKey, order: ValidSortOrder) => void;
  };
  onRestoreButtonClick: (entry: ValidChangelogEntry) => void;
  pagination: OffsetBasedPaginationState;
  /** Version number to highlight (for deep linking from annotations) */
  highlightVersion?: number;
};

type ExperimentJson = {
  ExperimentId: string;
  VariantId: string;
  ExperimentName: string;
  VariantName: string;
};

const isExperimentJson = (value: unknown): value is ExperimentJson => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const experimentId = Reflect.get(value, 'ExperimentId');
  const variantId = Reflect.get(value, 'VariantId');
  const experimentName = Reflect.get(value, 'ExperimentName');
  const variantName = Reflect.get(value, 'VariantName');

  return (
    typeof experimentId === 'string' &&
    typeof variantId === 'string' &&
    typeof experimentName === 'string' &&
    typeof variantName === 'string'
  );
};

type HistoryTableRowInfo = Map<HistoryTableParentColumn, CellDataType>;

const historyTableConfig = {
  defaultActiveSort: HistoryTableParentColumn.Date,
  hover: true,
  tableBorder: false,
};
const ruleOrderingConfigKey = '_RuleOrdering';

const mergeUnique = (existing: string[], incoming: string[]) => {
  if (!incoming.length) {
    return existing;
  }

  const merged = new Set(existing);
  let hasNewValues = false;
  incoming.forEach((value) => {
    if (!merged.has(value)) {
      merged.add(value);
      hasNewValues = true;
    }
  });

  return hasNewValues ? Array.from(merged) : existing;
};

const asCodeCellData = (entryValue: ValidConfigEntryValue | undefined): CellDataType => {
  if (entryValue?.valueType === ValidConfigEntryValueType.Json) {
    return {
      type: ColumnType.Code,
      value: prettyPrintJson(entryValue.jsonValue) ?? '{}',
      language: CodeEditorSupportedLanguages.Json,
      renderMode: 'editor',
      isInDiffContext: true,
    };
  }

  const cellValue = configEntryToStringValueForTable(entryValue);
  return {
    type: ColumnType.Code,
    value: cellValue.value,
    language: cellValue.language,
    useMonoFont: cellValue.useMonoFont,
  };
};

const HistoryTable = ({
  changelogEntries,
  sort,
  onRestoreButtonClick,
  pagination,
  isDataLoading,
  isResponseFailed,
  isUserForbidden,
  highlightVersion,
}: HistoryTableProps) => {
  const searchKey = useSearchKey();
  const { translate } = useRAQIV2TranslationDependencies();
  const currentSortOrder = sort.order;
  const onSortChange = sort.onChange;

  const onSortHandler = useCallback(
    (key: HistoryTableParentColumn, order?: TableSortOrder) => {
      let newSortOrder: SortOrder;
      if (order !== undefined) {
        newSortOrder = order === TableSortOrder.asc ? SortOrder.Ascending : SortOrder.Descending;
      } else {
        newSortOrder =
          currentSortOrder === SortOrder.Ascending ? SortOrder.Descending : SortOrder.Ascending;
      }

      switch (key) {
        case HistoryTableParentColumn.Date:
          onSortChange(SortKey.LastModifiedTime, newSortOrder);
          break;
        default:
          logAnalyticsError(`${key} is not sortable`);
          break;
      }
    },
    [currentSortOrder, onSortChange],
  );

  const sortOrder = useMemo(
    () => (currentSortOrder === SortOrder.Ascending ? TableSortOrder.asc : TableSortOrder.desc),
    [currentSortOrder],
  );

  const sortOrderBy: HistoryTableParentColumn | undefined = useMemo(() => {
    switch (sort.key) {
      case SortKey.LastModifiedTime:
        return HistoryTableParentColumn.Date;
      default:
        logAnalyticsError(`${sort.key} is not sortable`);
        return undefined;
    }
  }, [sort.key]);

  const comparator = useMemo(() => {
    return sortOrderBy
      ? getComparator<HistoryTableParentColumn, string, string>(sortOrder, sortOrderBy)
      : undefined;
  }, [sortOrder, sortOrderBy]);

  const formatPublishMessage = useCallback(
    (message: string) => {
      const publishDueToExperimentRolloutPrefix = 'RBLX_PUBLISHED_FROM_EXPERIMENT_VARIANT:';
      if (message.startsWith(publishDueToExperimentRolloutPrefix)) {
        const experimentJsonString = message.split(publishDueToExperimentRolloutPrefix)[1];
        try {
          const experimentJson = JSON.parse(experimentJsonString);
          if (!isExperimentJson(experimentJson)) {
            return message;
          }

          const { ExperimentName, VariantName } = experimentJson;
          return translate(
            translationKey(
              'Table.Column.Value.PublishedFromExperimentVariant',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
            {
              experimentName: ExperimentName,
              variant: VariantName === 'Control' ? 'control' : 'experiment',
            },
          );
        } catch {
          return message;
        }
      }

      return message;
    },
    [translate],
  );

  const formatConfigKeyForDisplay = useCallback(
    (configKey: string): string => {
      if (configKey === ruleOrderingConfigKey) {
        return translate(
          translationKey(
            'Table.Row.RuleOrderingChanges',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        );
      }

      return configKey;
    },
    [translate],
  );

  const parentRows = useMemo(() => {
    const currentYear = getCurrentYear();
    return changelogEntries.map((changelogEntry) => {
      const rowData = new Map<HistoryTableParentColumn, CellDataType>([
        [
          HistoryTableParentColumn.Collapse,
          {
            type: ColumnType.Actions,
            actions: [],
          },
        ],
        [
          HistoryTableParentColumn.Version,
          {
            type: ColumnType.Text,
            value: changelogEntry.cancelled
              ? translate(
                  translationKey(
                    'Table.Column.Value.VersionCancelled',
                    TranslationNamespace.UniverseConfigAndExperimentation,
                  ),
                  {
                    version: changelogEntry.version.toString(),
                  },
                )
              : changelogEntry.version.toString(),
          },
        ],
        [
          HistoryTableParentColumn.Date,
          {
            type: ColumnType.Timestamp,
            value: changelogEntry.time,
            format: {
              // Only show year when it's not the current year.
              year:
                new Date(changelogEntry.time).getFullYear() === currentYear ? undefined : '2-digit',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            },
          },
        ],
        [
          HistoryTableParentColumn.ChangedBy,
          {
            type: ColumnType.Text,
            value: changelogEntry.publishedByUsername,
          },
        ],
        [
          HistoryTableParentColumn.PublishMessage,
          {
            type: ColumnType.Text,
            value: formatPublishMessage(changelogEntry.message || ''),
          },
        ],
        [
          HistoryTableParentColumn.Restore,
          {
            type: ColumnType.Actions,
            actions: [
              {
                actionType: `restore-${changelogEntry.changelogEntryId}`,
                actionOn: '',
                renderedAsInNonCompactTable: 'dedicated-button',
                displayLabel: translate(
                  translationKey(
                    'Action.Button.Restore',
                    TranslationNamespace.UniverseConfigAndExperimentation,
                  ),
                ),
                onActionInvoked: () => onRestoreButtonClick(changelogEntry),
              },
            ],
          },
        ],
      ]);

      return {
        rowKey: changelogEntry.changelogEntryId.toString(),
        rowData,
        changelogEntry,
        isHighlighted: highlightVersion === parseInt(changelogEntry.version, 10),
        isExpandable: !!changelogEntry.changes?.length,
      };
    });
  }, [changelogEntries, formatPublishMessage, highlightVersion, onRestoreButtonClick, translate]);

  const sortedParentRows = useMemo(() => {
    if (!comparator) {
      return parentRows;
    }
    return parentRows.slice().sort((a, b) => comparator(a.rowData, b.rowData));
  }, [comparator, parentRows]);

  const rowData = useMemo(() => sortedParentRows.map((row) => row.rowData), [sortedParentRows]);
  const expandableRowKeys = useMemo(
    () => sortedParentRows.filter((row) => row.isExpandable).map((row) => row.rowKey),
    [sortedParentRows],
  );
  const highlightedRowKeys = useMemo(
    () => sortedParentRows.filter((row) => row.isHighlighted).map((row) => row.rowKey),
    [sortedParentRows],
  );

  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);

  useEffect(() => {
    if (!highlightedRowKeys.length) {
      return;
    }
    setExpandedRowKeys((existing) => mergeUnique(existing, highlightedRowKeys));
  }, [highlightedRowKeys]);

  useEffect(() => {
    if (!searchKey || !expandableRowKeys.length) {
      return;
    }
    setExpandedRowKeys((existing) => mergeUnique(existing, expandableRowKeys));
  }, [expandableRowKeys, searchKey]);

  const childColumnsByParentColumn = useMemo<
    GenericTableV2ExpandedRowColumnsByColumn<HistoryTableParentColumn>
  >(
    () => ({
      [HistoryTableParentColumn.Version]: {
        columnConfig: {
          columnType: ColumnType.Text,
        },
        getCellData: ({ rowIndex }) => {
          const changes = sortedParentRows[rowIndex]?.changelogEntry.changes ?? [];
          if (!changes.length) {
            return null;
          }

          return [
            {
              colSpan: 3,
              cellData: {
                type: ColumnType.Text,
                value: translate(
                  translationKey(
                    'Table.Column.Title.Key',
                    TranslationNamespace.UniverseConfigAndExperimentation,
                  ),
                ),
              },
            },
            ...changes.map((change) => {
              const configKey = change.current?.key ?? change.before?.key ?? '';
              const keyCellData: CellDataType = {
                type: ColumnType.Text,
                value: formatConfigKeyForDisplay(configKey),
              };
              return {
                colSpan: 3,
                cellData: keyCellData,
              };
            }),
          ] satisfies GenericTableV2ExpandedRowCellSpec[];
        },
      },
      [HistoryTableParentColumn.Date]: {
        columnConfig: {
          columnType: ColumnType.Text,
        },
        getCellData: ({ rowIndex }) => {
          const changes = sortedParentRows[rowIndex]?.changelogEntry.changes ?? [];
          if (!changes.length) {
            return null;
          }
          return Array.from({ length: changes.length + 1 }, () => ({
            skipCell: true,
          })) satisfies GenericTableV2ExpandedRowCellSpec[];
        },
      },
      [HistoryTableParentColumn.ChangedBy]: {
        columnConfig: {
          columnType: ColumnType.Text,
        },
        getCellData: ({ rowIndex }) => {
          const changes = sortedParentRows[rowIndex]?.changelogEntry.changes ?? [];
          if (!changes.length) {
            return null;
          }
          return Array.from({ length: changes.length + 1 }, () => ({
            skipCell: true,
          })) satisfies GenericTableV2ExpandedRowCellSpec[];
        },
      },
      [HistoryTableParentColumn.PublishMessage]: {
        columnConfig: {
          columnType: ColumnType.Code,
          columnAlignment: 'left',
        },
        getCellData: ({ rowIndex }) => {
          const changes = sortedParentRows[rowIndex]?.changelogEntry.changes ?? [];
          if (!changes.length) {
            return null;
          }
          const headerCell: GenericTableV2ExpandedRowCellSpec = {
            cellData: {
              type: ColumnType.Code,
              value: translate(
                translationKey(
                  'Table.Column.Title.Before',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              ),
            },
          };

          return [
            headerCell,
            ...changes.map((change) => {
              const beforeValue = change.before?.entryValue;
              const afterValue = change.current?.entryValue;
              const hasValidJsonDiff =
                beforeValue?.valueType === ValidConfigEntryValueType.Json &&
                afterValue?.valueType === ValidConfigEntryValueType.Json &&
                !!beforeValue &&
                !!afterValue;

              if (hasValidJsonDiff) {
                return {
                  colSpan: 2,
                  cellData: {
                    type: ColumnType.CodeDiff,
                    original: prettyPrintJson(beforeValue.jsonValue) ?? '{}',
                    modified: prettyPrintJson(afterValue.jsonValue) ?? '{}',
                    language: CodeEditorSupportedLanguages.Json,
                  },
                } satisfies GenericTableV2ExpandedRowCellSpec;
              }

              return {
                cellData: asCodeCellData(beforeValue),
              } satisfies GenericTableV2ExpandedRowCellSpec;
            }),
          ] satisfies GenericTableV2ExpandedRowCellSpec[];
        },
      },
      [HistoryTableParentColumn.Restore]: {
        columnConfig: {
          columnType: ColumnType.Code,
          columnAlignment: 'left',
        },
        getCellData: ({ rowIndex }) => {
          const changes = sortedParentRows[rowIndex]?.changelogEntry.changes ?? [];
          if (!changes.length) {
            return null;
          }
          const headerCell: GenericTableV2ExpandedRowCellSpec = {
            cellData: {
              type: ColumnType.Code,
              value: translate(
                translationKey(
                  'Table.Column.Title.After',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              ),
            },
          };

          return [
            headerCell,
            ...changes.map((change) => {
              const beforeValue = change.before?.entryValue;
              const afterValue = change.current?.entryValue;
              const hasValidJsonDiff =
                beforeValue?.valueType === ValidConfigEntryValueType.Json &&
                afterValue?.valueType === ValidConfigEntryValueType.Json &&
                !!beforeValue &&
                !!afterValue;

              if (hasValidJsonDiff) {
                return {
                  skipCell: true,
                } satisfies GenericTableV2ExpandedRowCellSpec;
              }

              return {
                cellData: asCodeCellData(afterValue),
              } satisfies GenericTableV2ExpandedRowCellSpec;
            }),
          ] satisfies GenericTableV2ExpandedRowCellSpec[];
        },
      },
    }),
    [formatConfigKeyForDisplay, sortedParentRows, translate],
  );

  const columnConfigs = useMemo<TableColumnConfig<HistoryTableParentColumn>[]>(() => {
    return orderedParentColumnConfigs.map((config) => {
      if (config.columnKey !== HistoryTableParentColumn.Date) {
        return config;
      }
      return {
        ...config,
        sort: {
          direction: sortOrder,
          onClick: onSortHandler,
        },
      };
    });
  }, [onSortHandler, sortOrder]);

  const getRowKey = useCallback(
    (_rowInfo: HistoryTableRowInfo, rowIndex: number) =>
      sortedParentRows[rowIndex]?.rowKey ?? `${sortedParentRows[rowIndex]?.changelogEntry.version}`,
    [sortedParentRows],
  );

  const getIsRowSelected = useCallback(
    (_rowInfo: HistoryTableRowInfo, rowIndex: number) =>
      sortedParentRows[rowIndex]?.isHighlighted ?? false,
    [sortedParentRows],
  );

  const isRowExpandable = useCallback(
    (_rowInfo: HistoryTableRowInfo, rowIndex: number) =>
      sortedParentRows[rowIndex]?.isExpandable ?? false,
    [sortedParentRows],
  );

  const rowExpansion = useMemo(
    () => ({
      expandedRowKeys,
      onExpandedRowKeysChange: setExpandedRowKeys,
      allowMultipleExpandedRows: true,
      expandedRowColumnsByColumn: childColumnsByParentColumn,
      isRowExpandable,
    }),
    [childColumnsByParentColumn, expandedRowKeys, isRowExpandable],
  );

  return (
    <GenericTableV2
      rowData={rowData}
      columnConfigs={columnConfigs}
      tableConfig={historyTableConfig}
      getRowKey={getRowKey}
      getIsRowSelected={getIsRowSelected}
      rowExpansion={rowExpansion}
      pagination={pagination.tablePagination}
      isDataLoading={isDataLoading}
      isResponseFailed={isResponseFailed}
      isUserForbidden={isUserForbidden}
      showNoDataMessage={
        !isDataLoading && !isResponseFailed && !isUserForbidden && rowData.length === 0
      }
    />
  );
};

export default withTranslation(HistoryTable, [
  TranslationNamespace.UniverseConfigAndExperimentation,
  TranslationNamespace.Table,
  TranslationNamespace.Analytics,
]);

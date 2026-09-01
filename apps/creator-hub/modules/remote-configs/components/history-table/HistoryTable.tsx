import { useCallback, useEffect, useMemo, useState } from 'react';
/* oxlint-disable typescript/no-unsafe-assignment typescript/restrict-template-expressions typescript/switch-exhaustiveness-check typescript/no-import-type-side-effects eslint/no-useless-return typescript/prefer-nullish-coalescing react/react-compiler -- pre-existing history table lint debt */
import { getCurrentYear } from '@rbx/core';
import { useFlag } from '@rbx/flags';
import { withTranslation } from '@rbx/intl';
import { isTargetingConfigsEnabled as isTargetingConfigsEnabledFlag } from '@generated/flags/creatorAnalytics';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { GenericChartState } from '@modules/charts-generic/charts/types/ChartTypes';
import CodeEditorSupportedLanguages from '@modules/charts-generic/components/CodeEditors/CodeEditorSupportedLanguages';
import GenericTableV2 from '@modules/charts-generic/tables/GenericTableV2';
import { getComparator } from '@modules/charts-generic/tables/tableSortUtils';
import {
  ColumnType,
  type TableColumnConfig,
} from '@modules/charts-generic/tables/types/GenericColumnType';
import type { CellDataType } from '@modules/charts-generic/tables/types/GenericTableType';
import {
  type GenericTableV2ExpandedRowCellSpec,
  type GenericTableV2ExpandedRowColumnsByColumn,
} from '@modules/charts-generic/tables/types/GenericTableType';
import { TableSortOrder } from '@modules/charts-generic/tables/types/TableSort';
import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  SortKey,
  SortOrder,
  ValidConfigEntryValueType,
} from '../../api/universeConfigsClientEnums';
import type {
  ValidConfigEntryValue,
  ValidChangelogEntry,
  ValidConfigEntryChange,
  ValidSortKey,
  ValidSortOrder,
} from '../../api/validTypes';
import { type ValidConditionRule } from '../../api/validTypes';
import type { OffsetBasedPaginationState } from '../../hooks/useOffsetBasedPaginationState';
import { sortConditionNamesByOrder } from '../../utils/configConditionValueExpansion';
import { configEntryToStringValueForTable } from '../../utils/configEntryToStringValue';
import parseRuleTokensFromConfigEntryValue from '../../utils/parseRuleTokensFromConfigEntryValue';
import prettyPrintJson from '../../utils/prettyPrintJson';
import RpnTokenChips from '../RpnTokenChips';
import { HistoryTableParentColumn, orderedParentColumnConfigs } from './historyTableColumns';
import { useSearchKey } from './SearchKeyContext';
import type { UsernameDecoratedChangelogEntry } from './types';

type HistoryTableProps = GenericChartState & {
  changelogEntries: UsernameDecoratedChangelogEntry[];
  conditionOrder?: string[];
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

type ExpandedConditionValueChangeRow = {
  change: ValidConfigEntryChange;
  conditionName: string;
  beforeValue: ValidConfigEntryValue | undefined;
  afterValue: ValidConfigEntryValue | undefined;
  beforeConditionValues?: Map<string, ValidConfigEntryValue>;
  afterConditionValues?: Map<string, ValidConfigEntryValue>;
  isConditionValueChange: true;
};

type ExpandedConfigValueChangeRow = {
  change: ValidConfigEntryChange;
  conditionName?: undefined;
  beforeValue: ValidConfigEntryValue | undefined;
  afterValue: ValidConfigEntryValue | undefined;
  beforeConditionValues?: Map<string, ValidConfigEntryValue>;
  afterConditionValues?: Map<string, ValidConfigEntryValue>;
  isConditionValueChange: false;
};

type ExpandedChangeRow = ExpandedConditionValueChangeRow | ExpandedConfigValueChangeRow;

const historyTableConfig = {
  defaultActiveSort: HistoryTableParentColumn.Date,
  hover: true,
  tableBorder: false,
};
const ruleOrderingConfigKey = '_RuleOrdering';
const getConditionValuesFromChangeEntry = (
  changeEntry: ValidConfigEntryChange['current'],
): Map<string, ValidConfigEntryValue> | undefined => {
  if (!changeEntry?.conditionValue?.size) {
    return undefined;
  }
  return changeEntry.conditionValue;
};

const toJsonCompatibleValue = (entryValue: ValidConfigEntryValue | undefined): unknown => {
  if (!entryValue) {
    return null;
  }
  switch (entryValue.valueType) {
    case ValidConfigEntryValueType.Boolean:
      return entryValue.boolValue;
    case ValidConfigEntryValueType.Number:
      return entryValue.numberValue;
    case ValidConfigEntryValueType.String:
      return entryValue.stringValue;
    case ValidConfigEntryValueType.Json:
      try {
        return JSON.parse(entryValue.jsonValue);
      } catch {
        return entryValue.jsonValue;
      }
    default: {
      const exhaustiveCheck: never = entryValue;
      throw new Error(`Unhandled value type: ${exhaustiveCheck}`);
    }
  }
};

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

const asConditionalCodeCellData = (
  conditionValues: Map<string, ValidConfigEntryValue>,
  conditionOrder?: string[],
): CellDataType => {
  const conditionNames = sortConditionNamesByOrder(
    Array.from(conditionValues.keys()),
    conditionOrder,
  );
  const normalizedConditionValues = conditionNames.map((conditionName) => ({
    conditionName,
    value: toJsonCompatibleValue(conditionValues.get(conditionName)),
  }));

  const serializedConditionValues =
    normalizedConditionValues.length === 1
      ? normalizedConditionValues[0]
      : normalizedConditionValues;

  return {
    type: ColumnType.Code,
    value: JSON.stringify(serializedConditionValues, null, 2),
    language: CodeEditorSupportedLanguages.Json,
    renderMode: 'editor',
    isInDiffContext: true,
  };
};

const asRuleTokenChipsCellData = (tokens: ValidConditionRule['tokens']): CellDataType => ({
  type: ColumnType.Other,
  value: <RpnTokenChips tokens={tokens} />,
});

const asEmptyTextCellData = (): CellDataType => ({
  type: ColumnType.Text,
  value: '',
});

const asConditionNameCellData = (conditionName: string): CellDataType => ({
  type: ColumnType.Other,
  value: (
    <span
      style={{
        overflowWrap: 'anywhere',
        whiteSpace: 'normal',
      }}>
      {conditionName}
    </span>
  ),
});

const getExpandedChangeRows = (
  changes: ValidConfigEntryChange[],
  isTargetingConfigsEnabled: boolean,
  conditionOrder?: string[],
): ExpandedChangeRow[] => {
  return changes.reduce<ExpandedChangeRow[]>((expandedRows, change) => {
    const beforeConditionValues = getConditionValuesFromChangeEntry(change.before);
    const afterConditionValues = getConditionValuesFromChangeEntry(change.current);
    const hasConditionValueChange = !!beforeConditionValues || !!afterConditionValues;

    if (isTargetingConfigsEnabled && hasConditionValueChange) {
      const conditionNames = sortConditionNamesByOrder(
        [
          ...new Set<string>([
            ...Array.from(beforeConditionValues?.keys() ?? []),
            ...Array.from(afterConditionValues?.keys() ?? []),
          ]),
        ],
        conditionOrder,
      );

      conditionNames.forEach((conditionName) => {
        expandedRows.push({
          change,
          conditionName,
          beforeValue: beforeConditionValues?.get(conditionName),
          afterValue: afterConditionValues?.get(conditionName),
          beforeConditionValues,
          afterConditionValues,
          isConditionValueChange: true,
        });
      });
      return expandedRows;
    }

    expandedRows.push({
      change,
      beforeValue: change.before?.entryValue,
      afterValue: change.current?.entryValue,
      beforeConditionValues,
      afterConditionValues,
      isConditionValueChange: false,
    });
    return expandedRows;
  }, []);
};

const getBeforeCellSpecForExpandedChangeRow = (
  row: ExpandedChangeRow,
  conditionOrder?: string[],
): GenericTableV2ExpandedRowCellSpec => {
  if (row.isConditionValueChange) {
    return {
      cellData: asCodeCellData(row.beforeValue),
    };
  }

  const beforeRuleTokens = parseRuleTokensFromConfigEntryValue(row.beforeValue);
  const afterRuleTokens = parseRuleTokensFromConfigEntryValue(row.afterValue);
  const hasRuleTokens = !!beforeRuleTokens || !!afterRuleTokens;
  const hasConditionalContext = !!row.beforeConditionValues || !!row.afterConditionValues;
  const { beforeValue, afterValue } = row;
  const hasValidJsonDiff =
    beforeValue?.valueType === ValidConfigEntryValueType.Json &&
    afterValue?.valueType === ValidConfigEntryValueType.Json;

  if (hasValidJsonDiff && !hasConditionalContext && !hasRuleTokens) {
    return {
      colSpan: 2,
      cellData: {
        type: ColumnType.CodeDiff,
        original: prettyPrintJson(beforeValue.jsonValue) ?? '{}',
        modified: prettyPrintJson(afterValue.jsonValue) ?? '{}',
        language: CodeEditorSupportedLanguages.Json,
      },
    };
  }

  if (beforeRuleTokens) {
    return {
      cellData: asRuleTokenChipsCellData(beforeRuleTokens),
    };
  }

  if (row.beforeConditionValues) {
    return {
      cellData: asConditionalCodeCellData(row.beforeConditionValues, conditionOrder),
    };
  }

  return {
    cellData: asCodeCellData(row.beforeValue),
  };
};

const getAfterCellSpecForExpandedChangeRow = (
  row: ExpandedChangeRow,
  conditionOrder?: string[],
): GenericTableV2ExpandedRowCellSpec => {
  if (row.isConditionValueChange) {
    return {
      cellData: asCodeCellData(row.afterValue),
    };
  }

  const beforeRuleTokens = parseRuleTokensFromConfigEntryValue(row.beforeValue);
  const afterRuleTokens = parseRuleTokensFromConfigEntryValue(row.afterValue);
  const hasRuleTokens = !!beforeRuleTokens || !!afterRuleTokens;
  const hasConditionalContext = !!row.beforeConditionValues || !!row.afterConditionValues;
  const { beforeValue, afterValue } = row;
  const hasValidJsonDiff =
    beforeValue?.valueType === ValidConfigEntryValueType.Json &&
    afterValue?.valueType === ValidConfigEntryValueType.Json;

  if (hasValidJsonDiff && !hasConditionalContext && !hasRuleTokens) {
    return {
      skipCell: true,
    };
  }

  if (afterRuleTokens) {
    return {
      cellData: asRuleTokenChipsCellData(afterRuleTokens),
    };
  }

  if (row.afterConditionValues) {
    return {
      cellData: asConditionalCodeCellData(row.afterConditionValues, conditionOrder),
    };
  }

  return {
    cellData: asCodeCellData(row.afterValue),
  };
};

const HistoryTable = ({
  changelogEntries,
  conditionOrder,
  sort,
  onRestoreButtonClick,
  pagination,
  isDataLoading,
  isResponseFailed,
  isUserForbidden,
  highlightVersion,
}: HistoryTableProps) => {
  const searchKey = useSearchKey();
  const { translate, tPendingTranslation } = useRAQIV2TranslationDependencies();
  const { id: universeId } = useUniverseResource();
  const { ready: isTargetingConfigsReady, value: isTargetingConfigsEnabledValue } = useFlag(
    isTargetingConfigsEnabledFlag,
    {
      universeId,
    },
  );
  const isTargetingConfigsEnabled = isTargetingConfigsReady && isTargetingConfigsEnabledValue;
  const currentSortOrder = sort.order;
  const onSortChange = sort.onChange;

  const conditionNameHeader = tPendingTranslation(
    'Condition name',
    'Column header for the condition name associated with a conditional config value change in the history table.',
    translationKey(
      'Table.Column.Title.ConditionName',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );

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
      ? getComparator<HistoryTableParentColumn, string>(sortOrder, sortOrderBy)
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
    (change: ValidConfigEntryChange): string => {
      const configKey = change.current?.key ?? change.before?.key ?? '';
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
                    version: changelogEntry.version,
                  },
                )
              : changelogEntry.version,
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
          const expandedChangeRows = getExpandedChangeRows(
            changes,
            isTargetingConfigsEnabled,
            conditionOrder,
          );

          return [
            {
              colSpan: isTargetingConfigsEnabled ? 1 : 3,
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
            ...expandedChangeRows.map(({ change }) => {
              const keyCellData: CellDataType = {
                type: ColumnType.Text,
                value: formatConfigKeyForDisplay(change),
              };
              return {
                colSpan: isTargetingConfigsEnabled ? 1 : 3,
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
          const expandedChangeRows = getExpandedChangeRows(
            changes,
            isTargetingConfigsEnabled,
            conditionOrder,
          );
          if (!isTargetingConfigsEnabled) {
            return Array.from({ length: expandedChangeRows.length + 1 }, () => ({
              skipCell: true,
            })) satisfies GenericTableV2ExpandedRowCellSpec[];
          }

          return [
            {
              colSpan: 2,
              cellData: {
                type: ColumnType.Text,
                value: conditionNameHeader,
              },
            },
            ...expandedChangeRows.map((expandedChangeRow) => ({
              colSpan: 2,
              cellData: expandedChangeRow.isConditionValueChange
                ? asConditionNameCellData(expandedChangeRow.conditionName)
                : asEmptyTextCellData(),
            })),
          ] satisfies GenericTableV2ExpandedRowCellSpec[];
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
          const expandedChangeRows = getExpandedChangeRows(
            changes,
            isTargetingConfigsEnabled,
            conditionOrder,
          );
          return Array.from({ length: expandedChangeRows.length + 1 }, () => ({
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
          const expandedChangeRows = getExpandedChangeRows(
            changes,
            isTargetingConfigsEnabled,
            conditionOrder,
          );
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
            ...expandedChangeRows.map((row) =>
              getBeforeCellSpecForExpandedChangeRow(row, conditionOrder),
            ),
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
          const expandedChangeRows = getExpandedChangeRows(
            changes,
            isTargetingConfigsEnabled,
            conditionOrder,
          );
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
            ...expandedChangeRows.map((row) =>
              getAfterCellSpecForExpandedChangeRow(row, conditionOrder),
            ),
          ] satisfies GenericTableV2ExpandedRowCellSpec[];
        },
      },
    }),
    [
      conditionNameHeader,
      conditionOrder,
      formatConfigKeyForDisplay,
      isTargetingConfigsEnabled,
      sortedParentRows,
      translate,
    ],
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
      sortedParentRows[rowIndex]?.rowKey ?? sortedParentRows[rowIndex]?.changelogEntry.version,
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

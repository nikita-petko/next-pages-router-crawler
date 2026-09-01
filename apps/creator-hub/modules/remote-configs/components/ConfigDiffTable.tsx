import { useCallback, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import CodeEditorSupportedLanguages from '@modules/charts-generic/components/CodeEditors/CodeEditorSupportedLanguages';
import DiffCodeEditor from '@modules/charts-generic/components/CodeEditors/DiffCodeEditor';
import CodeColumnCell from '@modules/charts-generic/tables/cells/CodeColumnCell';
import GenericTableV2 from '@modules/charts-generic/tables/GenericTableV2';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import type { TableColumnConfigWithoutSort } from '@modules/charts-generic/tables/types/GenericColumnType';
import type {
  ActionCellAction,
  CellDataType,
  GenericTableV2ExpandedRowColumnsByColumn,
} from '@modules/charts-generic/tables/types/GenericTableType';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type {
  ValidConfigEntryStaged,
  ValidConfigEntryValue,
  ValidNonDeletedConfigEntryOverride,
  ValidRuleOrdering,
} from '../api/validTypes';
import { sortConditionNamesByOrder } from '../utils/configConditionValueExpansion';
import { configEntryToStringValueForTable } from '../utils/configEntryToStringValue';
import { isRuleOrderingDifferent } from '../utils/isConditionOrderDifferent';
import { asConditionNameChipCellData } from './ConditionNameChip';

export enum DiffColumn {
  Key = 'key',
  Before = 'before',
  After = 'after',
  Actions = 'actions',
}

const getBaseColumnConfigs = (withActions: boolean): TableColumnConfigWithoutSort<DiffColumn>[] => [
  {
    columnKey: DiffColumn.Key,
    columnType: ColumnType.Other,
    titleKey: translationKey(
      'Table.Column.Title.Key',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    widthWeight: withActions ? 15 : 30,
  },
  {
    columnKey: DiffColumn.Before,
    columnType: ColumnType.Other,
    titleKey: translationKey(
      'Table.Column.Title.Before',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    widthWeight: withActions ? 40 : 35,
  },
  {
    columnKey: DiffColumn.After,
    columnType: ColumnType.Other,
    titleKey: translationKey(
      'Table.Column.Title.After',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    widthWeight: withActions ? 40 : 35,
  },
];

const actionsColumnConfig: TableColumnConfigWithoutSort<DiffColumn> = {
  columnKey: DiffColumn.Actions,
  columnType: ColumnType.Actions,
  titleKey: translationKey(
    'Table.Column.EmptyString',
    TranslationNamespace.UniverseConfigAndExperimentation,
  ),
  columnAlignment: 'right',
};

export const getConditionNameWithOverride = (
  name: string,
  overrides?: Record<string, string>,
): string => {
  const override = overrides?.[name];
  if (override === undefined || override === '') {
    return name;
  }
  return override;
};

export const ruleOrderingConditionOrderAsJson = (
  ruleOrdering?: ValidRuleOrdering,
  overrides?: Record<string, string>,
): string =>
  JSON.stringify(
    (ruleOrdering?.conditionOrder ?? []).map((name) =>
      getConditionNameWithOverride(name, overrides),
    ),
    null,
    2,
  );

export const isValidNonDeletedConfigEntryOverride = (
  overrideEntry: ValidConfigEntryStaged['overrideEntry'],
): overrideEntry is ValidNonDeletedConfigEntryOverride => {
  return 'entryValue' in overrideEntry.entry;
};

const hasBeforeConditions = (staged: ValidConfigEntryStaged): boolean => {
  if (staged.isDeleted) {
    return false;
  }
  return !!staged.currentConditionValue?.size;
};

const hasAfterConditions = (staged: ValidConfigEntryStaged): boolean => {
  if (staged.isDeleted) {
    return false;
  }
  if (!isValidNonDeletedConfigEntryOverride(staged.overrideEntry)) {
    return false;
  }
  return !!staged.overrideEntry.entry.conditionValue?.size;
};

const isExpandable = (staged: ValidConfigEntryStaged): boolean => {
  return hasBeforeConditions(staged) || hasAfterConditions(staged);
};

type ExpandedConditionValue = {
  label: string;
  beforeValue: ValidConfigEntryValue | undefined;
  afterValue: ValidConfigEntryValue | undefined;
};

const configEntryStagedToExpandedConditionValues = (
  staged: ValidConfigEntryStaged,
  defaultValueLabel: string,
  conditionOrder?: string[],
): ExpandedConditionValue[] => {
  if (staged.isDeleted || !isValidNonDeletedConfigEntryOverride(staged.overrideEntry)) {
    return [];
  }

  const conditionValueMap = staged.overrideEntry.entry.conditionValue;
  const currentConditionValueMap = staged.currentConditionValue;
  if (!conditionValueMap?.size && !currentConditionValueMap?.size) {
    return [];
  }

  const conditionNames = sortConditionNamesByOrder(
    [
      ...new Set<string>([
        ...Array.from(currentConditionValueMap?.keys() ?? []),
        ...Array.from(conditionValueMap?.keys() ?? []),
      ]),
    ],
    conditionOrder,
  );

  return [
    ...conditionNames.map((conditionName) => ({
      label: conditionName,
      beforeValue: currentConditionValueMap?.get(conditionName),
      afterValue: conditionValueMap?.get(conditionName),
    })),
    {
      label: defaultValueLabel,
      beforeValue: staged.currentValue ?? undefined,
      afterValue: staged.overrideEntry.entry.entryValue,
    },
  ];
};

export const configEntryValueToCodeCellData = (
  value: ReturnType<typeof configEntryToStringValueForTable>,
): CellDataType<string, ValidConfigEntryStaged> => ({
  type: ColumnType.Other,
  value: (
    <CodeColumnCell value={value.value} language={value.language} useMonoFont={value.useMonoFont} />
  ),
});

export type ExtraRow = {
  rowKey: string;
  cells: Map<DiffColumn, CellDataType<string, ValidConfigEntryStaged>>;
};

type RowInfo = {
  rowKey: string;
  rowData: Map<DiffColumn, CellDataType<string, ValidConfigEntryStaged>>;
  draft?: ValidConfigEntryStaged;
};

export type ConfigDiffTableProps = {
  drafts: ValidConfigEntryStaged[];
  currentRuleOrdering?: ValidRuleOrdering;
  stagedRuleOrdering?: ValidRuleOrdering;
  conditionNameOverrides?: Record<string, string>;
  hover?: boolean;
  tableBorder?: boolean;
  extraRows?: ExtraRow[];
  getRowActions?: (
    draft: ValidConfigEntryStaged,
  ) => ActionCellAction<string, ValidConfigEntryStaged>[];
  getOrderingActions?: () => ActionCellAction<string, ValidConfigEntryStaged>[];
  isDataLoading?: boolean;
  isResponseFailed?: boolean;
  isUserForbidden?: boolean;
};

const tableClasses = { tableContainer: 'overflow-hidden' } as const;

const ConfigDiffTable = ({
  drafts,
  currentRuleOrdering,
  stagedRuleOrdering,
  conditionNameOverrides,
  hover = true,
  tableBorder = true,
  extraRows,
  getRowActions,
  getOrderingActions,
  isDataLoading = false,
  isResponseFailed = false,
  isUserForbidden = false,
}: ConfigDiffTableProps) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());

  const showActions = !!getRowActions;

  const tableConfig = useMemo(() => ({ hover, tableBorder }), [hover, tableBorder]);

  const columnConfigsMemo = useMemo(
    () =>
      showActions
        ? [...getBaseColumnConfigs(true), actionsColumnConfig]
        : getBaseColumnConfigs(false),
    [showActions],
  );

  const multipleValueLabel = String(
    tPendingTranslation(
      'Multiple',
      'Label for a multiple value in the table.',
      translationKey(
        'Table.Column.Value.Multiple',
        TranslationNamespace.UniverseConfigAndExperimentation,
      ),
    ),
  );

  const defaultValueLabel = String(
    tPendingTranslation(
      'Default',
      'Label for a default value in the table.',
      translationKey(
        'Table.Column.Value.Default',
        TranslationNamespace.UniverseConfigAndExperimentation,
      ),
    ),
  );

  const conditionOrder = useMemo(
    () => stagedRuleOrdering?.conditionOrder ?? currentRuleOrdering?.conditionOrder,
    [currentRuleOrdering?.conditionOrder, stagedRuleOrdering?.conditionOrder],
  );

  const ruleOrderingChangesLabel = String(
    tPendingTranslation(
      'Rule ordering changes',
      'Label for the row representing staged rule ordering changes.',
      translationKey(
        'Table.Row.RuleOrderingChanges',
        TranslationNamespace.UniverseConfigAndExperimentation,
      ),
    ),
  );

  const tableRows = useMemo(() => {
    const rows: RowInfo[] = drafts.map((draft) => {
      const configKey = draft.overrideEntry.entry.key;

      const beforeCellData = hasBeforeConditions(draft)
        ? {
            type: ColumnType.Other as const,
            value: <CodeColumnCell value={multipleValueLabel} />,
          }
        : configEntryValueToCodeCellData(
            configEntryToStringValueForTable(draft.currentValue ?? undefined),
          );

      const afterCellData = hasAfterConditions(draft)
        ? {
            type: ColumnType.Other as const,
            value: <CodeColumnCell value={multipleValueLabel} />,
          }
        : configEntryValueToCodeCellData(
            configEntryToStringValueForTable(
              isValidNonDeletedConfigEntryOverride(draft.overrideEntry)
                ? draft.overrideEntry.entry.entryValue
                : undefined,
            ),
          );

      const rowData = new Map<DiffColumn, CellDataType<string, ValidConfigEntryStaged>>([
        [DiffColumn.Key, { type: ColumnType.Other, value: configKey }],
        [DiffColumn.Before, beforeCellData],
        [DiffColumn.After, afterCellData],
      ]);

      if (getRowActions) {
        rowData.set(DiffColumn.Actions, {
          type: ColumnType.Actions,
          actions: getRowActions(draft),
        });
      }

      return { rowKey: configKey, draft, rowData };
    });

    if (extraRows) {
      for (const extra of extraRows) {
        rows.push({ rowKey: extra.rowKey, rowData: extra.cells });
      }
    }

    if (isRuleOrderingDifferent(currentRuleOrdering, stagedRuleOrdering)) {
      const orderingRowData = new Map<DiffColumn, CellDataType<string, ValidConfigEntryStaged>>([
        [
          DiffColumn.Key,
          {
            type: ColumnType.Other,
            value: ruleOrderingChangesLabel,
            cellOverrideClassName: '[vertical-align:middle]',
          },
        ],
        [
          DiffColumn.Before,
          {
            type: ColumnType.Other,
            colSpan: 2,
            value: (
              <DiffCodeEditor
                original={ruleOrderingConditionOrderAsJson(
                  currentRuleOrdering,
                  conditionNameOverrides,
                )}
                modified={ruleOrderingConditionOrderAsJson(
                  stagedRuleOrdering,
                  conditionNameOverrides,
                )}
                language={CodeEditorSupportedLanguages.Json}
                readOnly
                height='auto'
              />
            ),
          },
        ],
        [DiffColumn.After, { type: ColumnType.Other, skipCell: true, value: null }],
      ]);

      if (getOrderingActions) {
        orderingRowData.set(DiffColumn.Actions, {
          type: ColumnType.Actions,
          actions: getOrderingActions(),
        });
      }

      rows.push({ rowKey: 'rule-ordering-changes', rowData: orderingRowData });
    }

    return rows;
  }, [
    drafts,
    extraRows,
    currentRuleOrdering,
    stagedRuleOrdering,
    conditionNameOverrides,
    multipleValueLabel,
    ruleOrderingChangesLabel,
    getRowActions,
    getOrderingActions,
  ]);

  const rowData = useMemo(() => tableRows.map(({ rowData: rd }) => rd), [tableRows]);

  const getExpandedConditionValuesByRowIndex = useCallback(
    (rowIndex: number): ExpandedConditionValue[] => {
      const draft = tableRows[rowIndex]?.draft;
      if (!draft) {
        return [];
      }
      return configEntryStagedToExpandedConditionValues(draft, defaultValueLabel, conditionOrder);
    },
    [conditionOrder, defaultValueLabel, tableRows],
  );

  const getRowKeyFn = useCallback(
    (_rowInfo: Map<DiffColumn, CellDataType<string, ValidConfigEntryStaged>>, rowIndex: number) =>
      tableRows[rowIndex]?.rowKey ?? `${rowIndex}`,
    [tableRows],
  );

  const isRowExpandable = useCallback(
    (_rowInfo: Map<DiffColumn, CellDataType<string, ValidConfigEntryStaged>>, rowIndex: number) => {
      const draft = tableRows[rowIndex]?.draft;
      return draft ? isExpandable(draft) : false;
    },
    [tableRows],
  );

  const expandedRowColumnsByColumn = useMemo<
    GenericTableV2ExpandedRowColumnsByColumn<DiffColumn, string, ValidConfigEntryStaged>
  >(
    () => ({
      [DiffColumn.Key]: {
        columnConfig: { columnType: ColumnType.Other, columnAlignment: 'right' },
        getCellData: ({ rowIndex }) => {
          const values = getExpandedConditionValuesByRowIndex(rowIndex);
          if (!values.length) {
            return null;
          }
          return values.map(({ label }) => ({
            cellData: asConditionNameChipCellData(
              getConditionNameWithOverride(label, conditionNameOverrides),
            ),
          }));
        },
      },
      [DiffColumn.Before]: {
        columnConfig: { columnType: ColumnType.Code },
        getCellData: ({ rowIndex }) => {
          const values = getExpandedConditionValuesByRowIndex(rowIndex);
          if (!values.length) {
            return null;
          }
          return values.map(({ beforeValue }) => {
            const stringValue = configEntryToStringValueForTable(beforeValue);
            return {
              cellData: {
                type: ColumnType.Code,
                value: stringValue.value,
                language: stringValue.language,
                useMonoFont: stringValue.useMonoFont,
              },
            };
          });
        },
      },
      [DiffColumn.After]: {
        columnConfig: { columnType: ColumnType.Code },
        getCellData: ({ rowIndex }) => {
          const values = getExpandedConditionValuesByRowIndex(rowIndex);
          if (!values.length) {
            return null;
          }
          return values.map(({ afterValue }) => {
            const stringValue = configEntryToStringValueForTable(afterValue);
            return {
              cellData: {
                type: ColumnType.Code,
                value: stringValue.value,
                language: stringValue.language,
                useMonoFont: stringValue.useMonoFont,
              },
            };
          });
        },
      },
    }),
    [conditionNameOverrides, getExpandedConditionValuesByRowIndex],
  );

  const rowExpansion = useMemo(
    () => ({ isRowExpandable, expandedRowColumnsByColumn }),
    [expandedRowColumnsByColumn, isRowExpandable],
  );

  if (!tableRows.length) {
    return null;
  }

  return (
    <GenericTableV2
      rowData={rowData}
      columnConfigs={columnConfigsMemo}
      tableConfig={tableConfig}
      classes={tableClasses}
      getRowKey={getRowKeyFn}
      rowExpansion={rowExpansion}
      isDataLoading={isDataLoading}
      isResponseFailed={isResponseFailed}
      isUserForbidden={isUserForbidden}
    />
  );
};

export default ConfigDiffTable;

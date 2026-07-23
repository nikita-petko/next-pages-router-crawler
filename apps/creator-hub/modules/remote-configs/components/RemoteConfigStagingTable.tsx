import { useCallback, useMemo } from 'react';
import {
  Action,
  ActionCellAction,
  CellDataType,
  ColumnType,
  GenericChartState,
  GenericTableV2,
  GenericTableV2ExpandedRowColumnsByColumn,
  TableColumnConfigWithoutSort,
} from '@modules/charts-generic';
import {
  translationKey,
  TranslationKeyToFormattedText,
  useTranslationWrapper,
} from '@modules/analytics-translations';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { Typography, EditOutlinedIcon, Grid } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation } from '@rbx/intl';
import {
  columnConfigs as mainTableColumnConfigs,
  RemoteConfigColumn,
} from './RemoteConfigMainTable';
import {
  ValidConfigEntryStaged,
  ValidConfigEntryValue,
  ValidNonDeletedConfigEntryOverride,
  ValidRuleOrdering,
} from '../api/validTypes';
import { ValidConfigEntryValueType } from '../api/universeConfigsClientEnums';
import { configEntryToStringValueForTable } from '../utils/configEntryToStringValue';
import { isRuleOrderingDifferent } from '../utils/isConditionOrderDifferent';
import {
  ActionInvokers,
  ActionsForConfigEntryDraft,
  RemoteConfigAction,
  RemoteConfigActionInfo,
  useConfigEntriesActions,
} from '../hooks/useConfigEntriesActions';

const mainTableKeyColumn = mainTableColumnConfigs.filter(
  (config) => config.columnKey === RemoteConfigColumn.Key,
);

const columnConfigs: TableColumnConfigWithoutSort<RemoteConfigColumn>[] = [
  ...mainTableKeyColumn,
  {
    columnKey: RemoteConfigColumn.After,
    columnType: ColumnType.Code,
    titleKey: translationKey(
      'Table.Column.Title.After',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    widthWeight: mainTableColumnConfigs.find(
      ({ columnKey }) => columnKey === RemoteConfigColumn.Override,
    )?.widthWeight,
  },
  {
    columnKey: RemoteConfigColumn.Before,
    columnType: ColumnType.Code,
    titleKey: translationKey(
      'Table.Column.Title.Before',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  },
  {
    columnKey: RemoteConfigColumn.Actions,
    columnType: ColumnType.Actions,
    titleKey: translationKey(
      // we don't want to show title for action columns
      // here we give it a non-existence translation key
      'Table.Column.EmptyString',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    columnAlignment: 'right',
  },
];

const orderedActionsAsMenuOptions = [
  RemoteConfigAction.ViewConfigSnippet,
  RemoteConfigAction.DiscardDraft,
] as const;
const ruleOrderingChangeRowKey = 'rule-ordering-changes';

// Synthetic payload used only to satisfy GenericTable action typing for the
// rule-ordering pseudo row. Do not treat this as a real staged config entry.
const ruleOrderingActionPayload: ValidConfigEntryStaged = {
  isDeleted: false,
  isPublishing: false,
  currentValue: null,
  overrideEntry: {
    entry: {
      key: ruleOrderingChangeRowKey,
      entryValue: {
        valueType: ValidConfigEntryValueType.String,
        stringValue: '',
      },
    },
  },
};

const ruleOrderingToCommaSeparatedString = (ruleOrdering?: ValidRuleOrdering): string => {
  return ruleOrdering?.conditionOrder?.join(', ') ?? '';
};

type ExpandedConditionValue = {
  label: string;
  value: ValidConfigEntryValue | undefined;
};

const isValidNonDeletedConfigEntryOverride = (
  overrideEntry: ValidConfigEntryStaged['overrideEntry'],
): overrideEntry is ValidNonDeletedConfigEntryOverride => {
  return 'entryValue' in overrideEntry.entry;
};

const configEntryStagedToConditionValueMap = (
  staged: ValidConfigEntryStaged,
): Map<string, ValidConfigEntryValue> | undefined => {
  if (!isValidNonDeletedConfigEntryOverride(staged.overrideEntry)) {
    return undefined;
  }

  return staged.overrideEntry.entry.conditionValue;
};

const configEntryStagedHasConditionValues = (staged: ValidConfigEntryStaged): boolean => {
  return !!configEntryStagedToConditionValueMap(staged)?.size;
};

const configEntryStagedToExpandedConditionValues = (
  staged: ValidConfigEntryStaged,
  defaultValueLabel: string,
): ExpandedConditionValue[] => {
  if (!isValidNonDeletedConfigEntryOverride(staged.overrideEntry)) {
    return [];
  }

  const conditionValueMap = staged.overrideEntry.entry.conditionValue;
  if (!conditionValueMap?.size) {
    return [];
  }

  return [
    ...Array.from(conditionValueMap.entries()).map(([conditionName, value]) => ({
      label: conditionName,
      value,
    })),
    {
      label: defaultValueLabel,
      value: staged.overrideEntry.entry.entryValue,
    },
  ];
};

const configEntryStagedToTableRowData = (
  staged: ValidConfigEntryStaged,
  actions: Record<
    ActionsForConfigEntryDraft,
    Action<ActionsForConfigEntryDraft, ValidConfigEntryStaged>
  >,
  translate: TranslationKeyToFormattedText,
  multipleValueLabel: string,
): Map<RemoteConfigColumn, CellDataType<ActionsForConfigEntryDraft, ValidConfigEntryStaged>> => {
  const configKey = staged.overrideEntry.entry.key;
  const hasConditionValues = configEntryStagedHasConditionValues(staged);

  const actionOptions: ActionCellAction<ActionsForConfigEntryDraft, ValidConfigEntryStaged>[] = [
    {
      ...actions[RemoteConfigAction.EditConfig],
      renderedAsInNonCompactTable: 'dedicated-button',
      displayLabel: translate(RemoteConfigActionInfo[RemoteConfigAction.EditConfig].labelKey),
      Icon: EditOutlinedIcon,
    },
  ];

  orderedActionsAsMenuOptions.forEach((actionType) => {
    actionOptions.push({
      ...actions[actionType],
      renderedAsInNonCompactTable: 'menu-item',
      color: RemoteConfigActionInfo[actionType].variant === 'alert' ? 'error' : undefined,
      displayLabel: translate(RemoteConfigActionInfo[actionType].labelKey),
    });
  });

  const cells: Array<
    [RemoteConfigColumn, CellDataType<ActionsForConfigEntryDraft, ValidConfigEntryStaged>]
  > = [
    [RemoteConfigColumn.Key, { type: ColumnType.Text, value: configKey }],
    [
      RemoteConfigColumn.After,
      hasConditionValues
        ? {
            type: ColumnType.Code,
            value: multipleValueLabel,
          }
        : {
            ...configEntryToStringValueForTable(
              isValidNonDeletedConfigEntryOverride(staged.overrideEntry)
                ? staged.overrideEntry.entry.entryValue
                : undefined,
            ),
            type: ColumnType.Code,
          },
    ],
    [
      RemoteConfigColumn.Before,
      {
        ...configEntryToStringValueForTable(staged.currentValue ?? undefined),
        type: ColumnType.Code,
      },
    ],
    [
      RemoteConfigColumn.Actions,
      {
        type: ColumnType.Actions,
        actions: actionOptions,
      },
    ],
  ];
  return new Map<
    RemoteConfigColumn,
    CellDataType<ActionsForConfigEntryDraft, ValidConfigEntryStaged>
  >(cells);
};

export type RemoteConfigStagingTableProps = GenericChartState & {
  drafts: ValidConfigEntryStaged[];
  isPublishing: boolean;
  currentRuleOrdering?: ValidRuleOrdering;
  stagedRuleOrdering?: ValidRuleOrdering;
  onEditRuleOrdering?: () => void;
} & ActionInvokers;

const tableConfigBase = { hover: true, tableBorder: false };

const RemoteConfigStagingTable = ({
  drafts,
  isPublishing,
  currentRuleOrdering,
  stagedRuleOrdering,
  onEditRuleOrdering,
  ...props
}: RemoteConfigStagingTableProps) => {
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { generateConfigEntriesDraftActions } = useConfigEntriesActions(props);
  const multipleValueLabel = tPendingTranslation(
    'Multiple',
    'Label for a multiple value in the table.',
    translationKey(
      'Table.Column.Value.Multiple',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const defaultValueLabel = tPendingTranslation(
    'Default',
    'Label for a default value in the table.',
    translationKey(
      'Table.Column.Value.Default',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const ruleOrderingChangesLabel = tPendingTranslation(
    'rule ordering changes',
    'Label for the row representing staged rule ordering changes.',
    translationKey(
      'Table.Row.RuleOrderingChanges',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );

  type TableRowData = Map<
    RemoteConfigColumn,
    CellDataType<ActionsForConfigEntryDraft, ValidConfigEntryStaged>
  >;
  type TableRowInfo = {
    rowKey: string;
    rowData: TableRowData;
    draft?: ValidConfigEntryStaged;
  };

  const tableRows = useMemo(() => {
    const nextRows: TableRowInfo[] = drafts.map((draft) => {
      const actions = generateConfigEntriesDraftActions(draft);
      return {
        rowKey: draft.overrideEntry.entry.key,
        draft,
        rowData: configEntryStagedToTableRowData(draft, actions, translate, multipleValueLabel),
      };
    });

    if (isRuleOrderingDifferent(currentRuleOrdering, stagedRuleOrdering)) {
      const ruleOrderingActions: ActionCellAction<
        ActionsForConfigEntryDraft,
        ValidConfigEntryStaged
      >[] = [
        {
          actionType: RemoteConfigAction.EditConfig,
          actionOn: ruleOrderingActionPayload,
          onActionInvoked: () => {
            onEditRuleOrdering?.();
          },
          disabled: !onEditRuleOrdering,
          renderedAsInNonCompactTable: 'dedicated-button',
          displayLabel: translate(RemoteConfigActionInfo[RemoteConfigAction.EditConfig].labelKey),
          Icon: EditOutlinedIcon,
        },
      ];
      nextRows.push({
        rowKey: ruleOrderingChangeRowKey,
        rowData: new Map<
          RemoteConfigColumn,
          CellDataType<ActionsForConfigEntryDraft, ValidConfigEntryStaged>
        >([
          [RemoteConfigColumn.Key, { type: ColumnType.Text, value: ruleOrderingChangesLabel }],
          [
            RemoteConfigColumn.After,
            {
              type: ColumnType.Code,
              value: ruleOrderingToCommaSeparatedString(stagedRuleOrdering),
            },
          ],
          [
            RemoteConfigColumn.Before,
            {
              type: ColumnType.Code,
              value: ruleOrderingToCommaSeparatedString(currentRuleOrdering),
            },
          ],
          [RemoteConfigColumn.Actions, { type: ColumnType.Actions, actions: ruleOrderingActions }],
        ]),
      });
    }
    return nextRows;
  }, [
    currentRuleOrdering,
    drafts,
    generateConfigEntriesDraftActions,
    multipleValueLabel,
    onEditRuleOrdering,
    ruleOrderingChangesLabel,
    stagedRuleOrdering,
    translate,
  ]);

  const rowData = useMemo(() => {
    return tableRows.map(({ rowData: tableRowData }) => tableRowData);
  }, [tableRows]);

  const getExpandedConditionValuesByRowIndex = useCallback(
    (rowIndex: number): ExpandedConditionValue[] => {
      const draft = tableRows[rowIndex]?.draft;
      if (!draft) {
        return [];
      }

      return configEntryStagedToExpandedConditionValues(draft, defaultValueLabel);
    },
    [defaultValueLabel, tableRows],
  );

  const getRowKey = useCallback(
    (
      _rowInfo: Map<
        RemoteConfigColumn,
        CellDataType<ActionsForConfigEntryDraft, ValidConfigEntryStaged>
      >,
      rowIndex: number,
    ) => {
      return tableRows[rowIndex]?.rowKey ?? `${rowIndex}`;
    },
    [tableRows],
  );

  const isRowExpandable = useCallback(
    (
      _rowInfo: Map<
        RemoteConfigColumn,
        CellDataType<ActionsForConfigEntryDraft, ValidConfigEntryStaged>
      >,
      rowIndex: number,
    ) => {
      const draft = tableRows[rowIndex]?.draft;
      return draft ? configEntryStagedHasConditionValues(draft) : false;
    },
    [tableRows],
  );

  const expandedRowColumnsByColumn = useMemo<
    GenericTableV2ExpandedRowColumnsByColumn<
      RemoteConfigColumn,
      ActionsForConfigEntryDraft,
      ValidConfigEntryStaged
    >
  >(
    () => ({
      [RemoteConfigColumn.Key]: {
        columnConfig: {
          columnType: ColumnType.BoldText,
          columnAlignment: 'right',
        },
        getCellData: ({ rowIndex }) => {
          const expandedConditionValues = getExpandedConditionValuesByRowIndex(rowIndex);
          if (!expandedConditionValues.length) {
            return null;
          }

          return expandedConditionValues.map(({ label }) => ({
            cellData: {
              type: ColumnType.BoldText,
              value: label,
            },
          }));
        },
      },
      [RemoteConfigColumn.After]: {
        columnConfig: {
          columnType: ColumnType.Code,
        },
        getCellData: ({ rowIndex }) => {
          const expandedConditionValues = getExpandedConditionValuesByRowIndex(rowIndex);
          if (!expandedConditionValues.length) {
            return null;
          }

          return expandedConditionValues.map(({ value }) => {
            const stringValue = configEntryToStringValueForTable(value);

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
    [getExpandedConditionValuesByRowIndex],
  );

  const rowExpansion = useMemo(
    () => ({
      isRowExpandable,
      expandedRowColumnsByColumn,
    }),
    [expandedRowColumnsByColumn, isRowExpandable],
  );

  const title = useMemo(() => {
    if (isPublishing) {
      return translate(
        translationKey(
          'Table.Title.Publishing',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      );
    }
    return translate(
      translationKey('Table.Title.Staged', TranslationNamespace.UniverseConfigAndExperimentation),
    );
  }, [isPublishing, translate]);

  const { isTargetingConfigsEnabled } = useFeatureFlagsForNamespace(
    ['isTargetingConfigsEnabled'],
    FeatureFlagNamespace.Analytics,
  );
  const tableConfig = useMemo(() => {
    return {
      ...tableConfigBase,
      tableBorder: isTargetingConfigsEnabled,
    };
  }, [isTargetingConfigsEnabled]);

  if (!tableRows.length) {
    return null;
  }
  return (
    <Grid
      container
      gap={2}
      marginTop='12px'
      marginBottom='12px'
      data-testid='remote-config-staging-table'>
      <Grid item>
        <Typography variant='h2' color='primary'>
          {title}
        </Typography>
      </Grid>
      <Grid item>
        <GenericTableV2
          rowData={rowData}
          columnConfigs={columnConfigs}
          tableConfig={tableConfig}
          getRowKey={getRowKey}
          rowExpansion={rowExpansion}
          {...props}
        />
      </Grid>
    </Grid>
  );
};
export default RemoteConfigStagingTable;

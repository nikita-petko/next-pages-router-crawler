import { useCallback, useMemo } from 'react';
import { getCurrentYear } from '@rbx/core';
import { useFlag } from '@rbx/flags';
import { useTranslation } from '@rbx/intl';
import { EditOutlinedIcon } from '@rbx/ui';
import { isTargetingConfigsEnabled as isTargetingConfigsEnabledFlag } from '@generated/flags/creatorAnalytics';
import type { TranslationKeyToFormattedText } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { GenericChartState } from '@modules/charts-generic/charts/types/ChartTypes';
import type { GenericTablePaginationSpec } from '@modules/charts-generic/tables/GenericTablePagination';
import GenericTableV2 from '@modules/charts-generic/tables/GenericTableV2';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import type { TableColumnConfigWithoutSort } from '@modules/charts-generic/tables/types/GenericColumnType';
import type {
  ActionCellAction,
  CellDataType,
} from '@modules/charts-generic/tables/types/GenericTableType';
import type { GenericTableV2ExpandedRowColumnsByColumn } from '@modules/charts-generic/tables/types/GenericTableType';
import { TableSortOrder } from '@modules/charts-generic/tables/types/TableSort';
import type { Action } from '@modules/charts-generic/types/Action';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { SortKey, SortOrder } from '../api/universeConfigsClientEnums';
import type {
  ValidConfigEntry,
  ValidConfigEntryDetail,
  ValidConfigEntryValue,
  ValidSortKey,
  ValidSortOrder,
} from '../api/validTypes';
import type { CanConfigureResult } from '../hooks/useCanConfigureOrPublish';
import useCanConfigureOrPublish from '../hooks/useCanConfigureOrPublish';
import type { ActionInvokers, ActionsForConfigEntry } from '../hooks/useConfigEntriesActions';
import {
  RemoteConfigAction,
  RemoteConfigActionInfo,
  useConfigEntriesActions,
} from '../hooks/useConfigEntriesActions';
import {
  configEntryHasConditionValues as configEntryHasConditionValuesForEntry,
  configEntryToExpandedConditionValues as configEntryToExpandedConditionValuesForEntry,
} from '../utils/configConditionValueExpansion';
import {
  configEntryToKey,
  configEntryToLastAccessedTimeAsString,
  configEntryToOverrideValue,
} from '../utils/configEntryAccessors';
import { configEntryToStringValueForTable } from '../utils/configEntryToStringValue';
import parseRuleTokensFromConfigEntryValue from '../utils/parseRuleTokensFromConfigEntryValue';
import { asConditionNameChipCellData } from './ConditionNameChip';
import RpnTokenChips from './RpnTokenChips';
import useSingleColumnTableSort from './useSingleColumnTableSort';

export type RemoteConfigMainTableProps = GenericChartState & {
  configEntries: ValidConfigEntryDetail[];
  isPublishing: boolean;
  lockedConfigKeys?: ReadonlySet<string>;
  conditionOrder?: string[];
  sort: {
    key: ValidSortKey;
    order: ValidSortOrder;
    onChange: (key: ValidSortKey, order: ValidSortOrder) => void;
  };
  pagination: GenericTablePaginationSpec;
} & ActionInvokers;

const EMPTY_LOCKED_KEYS: ReadonlySet<string> = new Set();

export enum RemoteConfigColumn {
  Before = 'before',
  After = 'after',
  Status = 'status',
  Key = 'key',
  Override = 'override',
  Description = 'description',
  LastUpdated = 'lastUpdated',
  LastAccessed = 'lastAccessed',
  Actions = 'actions',
}

const columnConfigsWithoutSort: TableColumnConfigWithoutSort<RemoteConfigColumn>[] = [
  {
    columnKey: RemoteConfigColumn.Key,
    titleKey: translationKey(
      'Table.Column.Title.Key',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    columnType: ColumnType.Text,
    widthWeight: 15,
    endAdormentColumnKeyInCompactView: RemoteConfigColumn.Actions,
  },
  {
    columnKey: RemoteConfigColumn.Override,
    titleKey: translationKey(
      'Table.Column.Title.Override',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    columnType: ColumnType.Code,
    widthWeight: 44,
  },
  {
    columnKey: RemoteConfigColumn.LastUpdated,
    titleKey: translationKey(
      'Table.Column.Title.LastUpdated',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    columnType: ColumnType.Timestamp,
    widthWeight: 15,
  },
  {
    columnKey: RemoteConfigColumn.LastAccessed,
    titleKey: translationKey(
      'Table.Column.Title.LastAccessed',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    columnType: ColumnType.Timestamp,
    widthWeight: 15,
  },
  {
    columnKey: RemoteConfigColumn.Actions,
    // we don't want to show title for action columns
    // here we give it a non-existence translation key
    titleKey: translationKey(
      'Table.Column.EmptyString',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    columnType: ColumnType.Actions,
    columnAlignment: 'right',
  },
] as const;
export { columnConfigsWithoutSort as columnConfigs };

export type ConfigEntryTableActions = {
  onDelete?: () => void;
  onEdit?: () => void;
  onViewSnippet?: (key: string, value: ValidConfigEntryValue) => void;
};

const orderedActionsAsMenuOptions = [
  RemoteConfigAction.ViewConfigSnippet,
  RemoteConfigAction.DeleteConfig,
] as const;

const disabledActionOptionsWhenNotCanConfigure = [
  RemoteConfigAction.DiscardStagedChanges,
  RemoteConfigAction.DiscardDraft,
  RemoteConfigAction.UpdateDraft,
  RemoteConfigAction.EditConfig,
  RemoteConfigAction.DeleteConfig,
];

const disabledActionOptionsWhenNotCanPublish = [
  RemoteConfigAction.Publish,
  RemoteConfigAction.ForcePublish,
  RemoteConfigAction.CancelPublish,
];

type ExpandedConditionValue = {
  label: string;
  value: ValidConfigEntryValue | undefined;
};

const isConfigEntryValueEntry = (
  entry: ValidConfigEntryDetail['overrideEntry']['entry'],
): entry is ValidConfigEntry => {
  return 'entryValue' in entry;
};

const configEntryDetailToEntry = (
  configEntry: ValidConfigEntryDetail,
): ValidConfigEntry | undefined => {
  const { entry } = configEntry.overrideEntry;
  if (!isConfigEntryValueEntry(entry)) {
    return undefined;
  }

  return entry;
};

const configEntryHasConditionValues = (configEntry: ValidConfigEntryDetail): boolean => {
  return configEntryHasConditionValuesForEntry(configEntryDetailToEntry(configEntry));
};

const configEntryToExpandedConditionValues = (
  configEntry: ValidConfigEntryDetail,
  defaultValueLabel: string,
  conditionOrder?: string[],
): ExpandedConditionValue[] => {
  const entry = configEntryDetailToEntry(configEntry);
  if (!entry) {
    return [];
  }

  return configEntryToExpandedConditionValuesForEntry(
    entry,
    defaultValueLabel,
    configEntryToOverrideValue(configEntry),
    conditionOrder,
  );
};

const configEntryValueToExpandedOverrideCellData = (
  value: ValidConfigEntryValue | undefined,
): CellDataType<string, ValidConfigEntryDetail> => {
  const ruleTokens = parseRuleTokensFromConfigEntryValue(value);
  if (ruleTokens) {
    return {
      type: ColumnType.Other,
      value: <RpnTokenChips tokens={ruleTokens} />,
    };
  }

  const stringValue = configEntryToStringValueForTable(value);
  return {
    type: ColumnType.Code,
    value: stringValue.value,
    language: stringValue.language,
    useMonoFont: stringValue.useMonoFont,
  };
};

const configEntryToTableDetail = (
  configEntry: ValidConfigEntryDetail,
  actions: Record<ActionsForConfigEntry, Action<ActionsForConfigEntry, ValidConfigEntryDetail>>,
  translate: TranslationKeyToFormattedText,
  multipleValueLabel: string,
  { canConfigure, configureErrorMessage, canPublish, publishErrorMessage }: CanConfigureResult,
  lockedConfigKeys: ReadonlySet<string>,
  configLockedByExperimentTooltip: string,
): Map<RemoteConfigColumn, CellDataType<string, ValidConfigEntryDetail>> => {
  const configKey = configEntryToKey(configEntry);
  const hasConditionValues = configEntryHasConditionValues(configEntry);
  const isLockedByExperiment = lockedConfigKeys.has(configKey);
  const isEditDisabled = !canConfigure || isLockedByExperiment;
  let editTooltipLabel: string | undefined;
  if (!canConfigure) {
    editTooltipLabel = configureErrorMessage;
  } else if (isLockedByExperiment) {
    editTooltipLabel = configLockedByExperimentTooltip;
  }

  const actionOptions: ActionCellAction<ActionsForConfigEntry, ValidConfigEntryDetail>[] = [
    {
      ...actions[RemoteConfigAction.EditConfig],
      renderedAsInNonCompactTable: 'dedicated-button',
      displayLabel: translate(RemoteConfigActionInfo[RemoteConfigAction.EditConfig].labelKey),
      Icon: EditOutlinedIcon,
      disabled: isEditDisabled,
      tooltipLabel: editTooltipLabel,
    },
  ];

  orderedActionsAsMenuOptions.forEach((actionType) => {
    actionOptions.push({
      ...actions[actionType],
      renderedAsInNonCompactTable: 'menu-item',
      color: RemoteConfigActionInfo[actionType].variant === 'alert' ? 'error' : undefined,
      displayLabel: translate(RemoteConfigActionInfo[actionType].labelKey),
      disabled:
        (disabledActionOptionsWhenNotCanConfigure.includes(actionType) && !canConfigure) ||
        (disabledActionOptionsWhenNotCanPublish.includes(actionType) && !canPublish),
      tooltipLabel: configureErrorMessage ?? publishErrorMessage,
    });
  });

  const lastUpdated = configEntry.overrideEntry.lastModifiedTime;
  const lastAccessed = configEntryToLastAccessedTimeAsString(configEntry);
  const currentYear = getCurrentYear();

  const cells: Array<[RemoteConfigColumn, CellDataType<string, ValidConfigEntryDetail>]> = [
    [
      RemoteConfigColumn.Key,
      {
        type: ColumnType.Text,
        value: configKey,
      },
    ],
    [
      RemoteConfigColumn.Override,
      hasConditionValues
        ? {
            type: ColumnType.Code,
            value: multipleValueLabel,
          }
        : {
            ...configEntryToStringValueForTable(configEntryToOverrideValue(configEntry)),
            type: ColumnType.Code,
          },
    ],
    [
      RemoteConfigColumn.LastUpdated,
      {
        type: ColumnType.Timestamp,
        value: lastUpdated ?? '',
        format: {
          // only show year if it's not the current year
          year:
            lastUpdated && new Date(lastUpdated).getFullYear() === currentYear
              ? undefined
              : '2-digit',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        },
      },
    ],
    [
      RemoteConfigColumn.LastAccessed,
      {
        type: ColumnType.Timestamp,
        value: lastAccessed ?? '',
        format: {
          // only show year if it's not the current year
          year:
            lastAccessed && new Date(lastAccessed).getFullYear() === currentYear
              ? undefined
              : '2-digit',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        },
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
  return new Map<RemoteConfigColumn, CellDataType<string, ValidConfigEntryDetail>>(cells);
};

const sortableColumns = [
  RemoteConfigColumn.Key,
  RemoteConfigColumn.LastUpdated,
  RemoteConfigColumn.LastAccessed,
] as const;
type TSortableColumn = (typeof sortableColumns)[number];
const columnToSortKey: Record<TSortableColumn, ValidSortKey> = {
  [RemoteConfigColumn.Key]: SortKey.ConfigEntryKey,
  [RemoteConfigColumn.LastUpdated]: SortKey.LastModifiedTime,
  [RemoteConfigColumn.LastAccessed]: SortKey.LastAccessedTime,
};
const sortKeyToColumn: Record<ValidSortKey, TSortableColumn> = {
  [SortKey.ConfigEntryKey]: RemoteConfigColumn.Key,
  [SortKey.LastModifiedTime]: RemoteConfigColumn.LastUpdated,
  [SortKey.LastAccessedTime]: RemoteConfigColumn.LastAccessed,
};
const defaultSortOrder: Record<TSortableColumn, TableSortOrder> = {
  [RemoteConfigColumn.Key]: TableSortOrder.asc,
  [RemoteConfigColumn.LastUpdated]: TableSortOrder.desc,
  [RemoteConfigColumn.LastAccessed]: TableSortOrder.desc,
};
const tableConfigBase = {
  defaultActiveSort: RemoteConfigColumn.LastUpdated,
  hover: true,
  tableBorder: false,
};
const useRemoteConfigTableSort = (
  sort: RemoteConfigMainTableProps['sort'],
  columnConfigs: TableColumnConfigWithoutSort<RemoteConfigColumn>[],
) => {
  const { onChange: onSortChangeGiven, key: sortKey, order: sortOrder } = sort;
  const currentSort = useMemo(() => {
    return {
      key: sortKeyToColumn[sortKey],
      order: sortOrder === SortOrder.Ascending ? TableSortOrder.asc : TableSortOrder.desc,
    };
  }, [sortKey, sortOrder]);
  const onSortChange = (key: TSortableColumn, tableOrder: TableSortOrder) => {
    const apiOrder = tableOrder === TableSortOrder.asc ? SortOrder.Ascending : SortOrder.Descending;
    onSortChangeGiven(columnToSortKey[key], apiOrder);
  };
  const { configsWithSort } = useSingleColumnTableSort(
    currentSort,
    onSortChange,
    columnConfigs,
    sortableColumns,
    defaultSortOrder,
  );
  return configsWithSort;
};

const RemoteConfigMainTable = ({
  configEntries,
  sort,
  pagination,
  lockedConfigKeys = EMPTY_LOCKED_KEYS,
  conditionOrder,
  ...props
}: RemoteConfigMainTableProps) => {
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { generateConfigEntriesActions } = useConfigEntriesActions(props);
  const canConfigureResult = useCanConfigureOrPublish();

  const configLockedByExperimentTooltip = tPendingTranslation(
    'Config used by scheduled or running experiment',
    'Tooltip shown when editing a remote config is blocked because it is used by an experiment.',
    translationKey(
      'Tooltip.ConfigLockedByExperiment',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );

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

  const configsWithSort = useRemoteConfigTableSort(sort, columnConfigsWithoutSort);

  const tableRows = useMemo(() => {
    return configEntries.map((configEntry) => {
      const actions = generateConfigEntriesActions(configEntry);
      return {
        rowKey: configEntryToKey(configEntry),
        configEntry,
        rowData: configEntryToTableDetail(
          configEntry,
          actions,
          translate,
          multipleValueLabel,
          canConfigureResult,
          lockedConfigKeys,
          configLockedByExperimentTooltip,
        ),
      };
    });
  }, [
    canConfigureResult,
    configEntries,
    configLockedByExperimentTooltip,
    generateConfigEntriesActions,
    lockedConfigKeys,
    translate,
    multipleValueLabel,
  ]);

  const rowData = useMemo(() => {
    return tableRows.map(({ rowData: tableRowData }) => tableRowData);
  }, [tableRows]);

  const getExpandedConditionValuesByRowIndex = useCallback(
    (rowIndex: number): ExpandedConditionValue[] => {
      const configEntry = tableRows[rowIndex]?.configEntry;
      if (!configEntry) {
        return [];
      }

      return configEntryToExpandedConditionValues(configEntry, defaultValueLabel, conditionOrder);
    },
    [conditionOrder, defaultValueLabel, tableRows],
  );

  const getRowKey = useCallback(
    (
      _rowInfo: Map<RemoteConfigColumn, CellDataType<string, ValidConfigEntryDetail>>,
      rowIndex: number,
    ) => {
      return tableRows[rowIndex]?.rowKey ?? `${rowIndex}`;
    },
    [tableRows],
  );

  const isRowExpandable = useCallback(
    (
      _rowInfo: Map<RemoteConfigColumn, CellDataType<string, ValidConfigEntryDetail>>,
      rowIndex: number,
    ) => {
      const configEntry = tableRows[rowIndex]?.configEntry;
      return configEntry ? configEntryHasConditionValues(configEntry) : false;
    },
    [tableRows],
  );

  const expandedRowColumnsByColumn = useMemo<
    GenericTableV2ExpandedRowColumnsByColumn<RemoteConfigColumn, string, ValidConfigEntryDetail>
  >(
    () => ({
      [RemoteConfigColumn.Key]: {
        columnConfig: {
          columnType: ColumnType.Other,
          columnAlignment: 'right',
        },
        getCellData: ({ rowIndex }) => {
          const expandedConditionValues = getExpandedConditionValuesByRowIndex(rowIndex);
          if (!expandedConditionValues.length) {
            return null;
          }

          return expandedConditionValues.map(({ label }) => ({
            cellData: asConditionNameChipCellData(label),
          }));
        },
      },
      [RemoteConfigColumn.Override]: {
        columnConfig: {
          columnType: ColumnType.Code,
        },
        getCellData: ({ rowIndex }) => {
          const expandedConditionValues = getExpandedConditionValuesByRowIndex(rowIndex);
          if (!expandedConditionValues.length) {
            return null;
          }

          return expandedConditionValues.map(({ value }) => {
            return {
              cellData: configEntryValueToExpandedOverrideCellData(value),
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

  const { id: universeId } = useUniverseResource();
  const { ready: isTargetingConfigsReady, value: isTargetingConfigsEnabledValue } = useFlag(
    isTargetingConfigsEnabledFlag,
    {
      universeId,
    },
  );
  const isTargetingConfigsEnabled = isTargetingConfigsReady && isTargetingConfigsEnabledValue;
  const tableConfig = useMemo(() => {
    return {
      ...tableConfigBase,
      tableBorder: isTargetingConfigsEnabled,
    };
  }, [isTargetingConfigsEnabled]);

  return (
    <span data-testid='remote-config-main-table'>
      <GenericTableV2
        rowData={rowData}
        columnConfigs={configsWithSort}
        tableConfig={tableConfig}
        getRowKey={getRowKey}
        rowExpansion={rowExpansion}
        pagination={pagination}
        {...props}
      />
    </span>
  );
};
export default RemoteConfigMainTable;

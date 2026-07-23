import React, { FC, useMemo, useCallback, useState } from 'react';
import {
  GenericTableV2,
  ColumnType,
  CellDataType,
  TableColumnConfig,
  GenericTablePaginationSpec,
} from '@modules/charts-generic';
import { Toggle } from '@rbx/foundation-ui';
import { EditOutlinedIcon, DeleteOutlinedIcon } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { translationKey } from '@modules/analytics-translations';
import { useRAQIV2TranslationDependencies } from '@modules/experience-analytics-shared';

enum AlertConfigColumnKey {
  Name = 'name',
  Metric = 'metric',
  Condition = 'condition',
  Description = 'description',
  TurnOnOff = 'turnOnOff',
  Actions = 'actions',
}

enum ConfigActionType {
  Edit = 'edit',
  Delete = 'delete',
}

type AlertConfigRow = {
  id: string;
  name: string;
  metric: string;
  condition: string;
  description: string;
  enabled: boolean;
};

const MOCK_DATA: AlertConfigRow[] = [
  {
    id: '1',
    name: 'P10 Android crash rate',
    metric: 'Client crash rate',
    condition: 'Value above 40%',
    description: 'This is a very very very long description',
    enabled: false,
  },
  {
    id: '2',
    name: 'Low FPS',
    metric: 'Client frame rate',
    condition: 'Change above -80%',
    description: 'This is a description',
    enabled: false,
  },
  {
    id: '3',
    name: 'CCU drops',
    metric: 'Concurrent users',
    condition: 'Change above -10%',
    description: 'This is a description',
    enabled: false,
  },
];

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];
const DEFAULT_PAGE_SIZE = 10;
const TOTAL_MOCK_ITEMS = 50;

const columnConfigs: TableColumnConfig<AlertConfigColumnKey>[] = [
  {
    columnKey: AlertConfigColumnKey.Name,
    columnType: ColumnType.Text,
    titleKey: translationKey('Title.Table.AlertName', TranslationNamespace.Analytics),
    endAdormentColumnKeyInCompactView: AlertConfigColumnKey.Actions,
  },
  {
    columnKey: AlertConfigColumnKey.Metric,
    columnType: ColumnType.Text,
    titleKey: translationKey('Label.Metric', TranslationNamespace.Analytics),
  },
  {
    columnKey: AlertConfigColumnKey.Condition,
    columnType: ColumnType.Text,
    titleKey: translationKey('Title.Table.Condition', TranslationNamespace.Analytics),
  },
  {
    columnKey: AlertConfigColumnKey.Description,
    columnType: ColumnType.Text,
    titleKey: translationKey('Title.Table.Description', TranslationNamespace.Analytics),
  },
  {
    columnKey: AlertConfigColumnKey.TurnOnOff,
    columnType: ColumnType.Other,
    titleKey: translationKey('Title.Table.TurnOnOff', TranslationNamespace.Analytics),
  },
  {
    columnKey: AlertConfigColumnKey.Actions,
    columnType: ColumnType.Actions,
    titleKey: translationKey('Title.Table.Actions', TranslationNamespace.Analytics),
    titleOverride: '',
  },
];

const AlertConfigurationsTable: FC = () => {
  const { translate } = useRAQIV2TranslationDependencies();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(MOCK_DATA.map((row) => [row.id, row.enabled])),
  );

  const handleToggle = useCallback((id: string) => {
    setEnabledMap((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const rowData = useMemo(() => {
    return MOCK_DATA.map((config) => {
      return new Map<AlertConfigColumnKey, CellDataType<ConfigActionType>>([
        [
          AlertConfigColumnKey.Name,
          {
            type: ColumnType.Text,
            value: config.name,
          },
        ],
        [
          AlertConfigColumnKey.Metric,
          {
            type: ColumnType.Text,
            value: config.metric,
          },
        ],
        [
          AlertConfigColumnKey.Condition,
          {
            type: ColumnType.Text,
            value: config.condition,
          },
        ],
        [
          AlertConfigColumnKey.Description,
          {
            type: ColumnType.Text,
            value: config.description,
          },
        ],
        [
          AlertConfigColumnKey.TurnOnOff,
          {
            type: ColumnType.Other,
            value: (
              <Toggle
                size='Medium'
                placement='Start'
                isChecked={enabledMap[config.id] ?? false}
                onCheckedChange={() => handleToggle(config.id)}
                aria-label={translate(
                  translationKey('Action.ToggleAlert', TranslationNamespace.Analytics),
                )}
              />
            ),
          },
        ],
        [
          AlertConfigColumnKey.Actions,
          {
            type: ColumnType.Actions,
            actions: [
              {
                actionType: ConfigActionType.Edit,
                actionOn: config.id,
                onActionInvoked: () => {},
                displayLabel: translate(
                  translationKey('Action.Edit', TranslationNamespace.Analytics),
                ),
                renderedAsInNonCompactTable: 'dedicated-button',
                Icon: EditOutlinedIcon,
              },
              {
                actionType: ConfigActionType.Delete,
                actionOn: config.id,
                onActionInvoked: () => {},
                displayLabel: translate(
                  translationKey('Action.Delete', TranslationNamespace.Analytics),
                ),
                renderedAsInNonCompactTable: 'dedicated-button',
                Icon: DeleteOutlinedIcon,
              },
            ],
          },
        ],
      ]);
    });
  }, [enabledMap, translate, handleToggle]);

  const pagination: GenericTablePaginationSpec = useMemo(
    () => ({
      page,
      total: TOTAL_MOCK_ITEMS,
      pageSize,
      pageSizeOptions: PAGE_SIZE_OPTIONS,
      setPageSize: (newSize: number) => {
        setPageSize(newSize);
        setPage(0);
      },
      onNextPage: () => setPage((p) => p + 1),
      onPreviousPage: () => setPage((p) => Math.max(0, p - 1)),
      hasNext: (page + 1) * pageSize < TOTAL_MOCK_ITEMS,
      hasPrevious: page > 0,
    }),
    [page, pageSize],
  );

  const getRowKey = useCallback(
    (_: Map<AlertConfigColumnKey, CellDataType<ConfigActionType>>, index: number) =>
      `config-${MOCK_DATA[index]?.id ?? String(index)}`,
    [],
  );

  return (
    <GenericTableV2
      columnConfigs={columnConfigs}
      rowData={rowData}
      isDataLoading={false}
      isResponseFailed={false}
      isUserForbidden={false}
      showNoDataMessage={MOCK_DATA.length === 0}
      pagination={pagination}
      tableConfig={{
        stickyHeader: true,
        hover: true,
        tableBorder: false,
        stickyLastColumn: true,
      }}
      getRowKey={getRowKey}
    />
  );
};

export default React.memo(AlertConfigurationsTable);

import React, { FC, useMemo, useCallback } from 'react';
import {
  GenericTableV2,
  ColumnType,
  CellDataType,
  TableColumnConfig,
  GenericTablePaginationSpec,
  ChartHeader,
  formatDurationInSecond,
} from '@modules/charts-generic';
import { useRAQIV2TranslationDependencies } from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { translationKey } from '@modules/analytics-translations';
import type { CrashDumpData } from '@modules/clients/crashDumps';
import { useServerMemoryDumpsData } from './ServerMemoryDumpsDataProvider';

enum CrashesTableColumnKey {
  Timestamp = 'timestamp',
  ServerVersion = 'serverVersion',
  ServerUptime = 'serverUptime',
  PlaceID = 'placeId',
  PlaceVersion = 'placeVersion',
  Actions = 'actions',
}

enum CrashesTableActionType {
  View = 'view',
}

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];
const NO_DATA_LABEL = 'N/A';

const crashesTableColumnConfigs: TableColumnConfig<CrashesTableColumnKey>[] = [
  {
    columnKey: CrashesTableColumnKey.Timestamp,
    columnType: ColumnType.Timestamp,
    titleKey: translationKey('Title.Table.Timestamp', TranslationNamespace.Analytics),
    endAdormentColumnKeyInCompactView: CrashesTableColumnKey.Actions,
  },
  {
    columnKey: CrashesTableColumnKey.ServerVersion,
    columnType: ColumnType.Text,
    titleKey: translationKey('Title.Table.ServerVersion', TranslationNamespace.Analytics),
  },
  {
    columnKey: CrashesTableColumnKey.ServerUptime,
    columnType: ColumnType.Text,
    titleKey: translationKey('Title.Table.ServerUptime', TranslationNamespace.Analytics),
  },
  {
    columnKey: CrashesTableColumnKey.PlaceID,
    columnType: ColumnType.Text,
    titleKey: translationKey('Title.Table.PlaceId', TranslationNamespace.Analytics),
  },
  {
    columnKey: CrashesTableColumnKey.PlaceVersion,
    columnType: ColumnType.Text,
    titleKey: translationKey('Title.Table.PlaceVersion', TranslationNamespace.Analytics),
  },
  {
    columnKey: CrashesTableColumnKey.Actions,
    columnType: ColumnType.Actions,
    titleKey: translationKey('Title.Table.Actions', TranslationNamespace.Analytics),
    titleOverride: '',
  },
];

const ServerMemoryDumpsTable: FC = () => {
  const { translate } = useRAQIV2TranslationDependencies();

  const {
    data,
    selectedDumpId,
    selectedCrashDumpFileState,
    isDataLoading,
    isResponseFailed,
    isUserForbidden,
    page,
    total,
    pageSize,
    hasNext,
    hasPrevious,
    setPageSize,
    nextPage,
    previousPage,
    onSelectDumpId,
  } = useServerMemoryDumpsData();

  const handleSelectCrash = useCallback(
    (crash: CrashDumpData) => {
      onSelectDumpId(crash.dumpId);
    },
    [onSelectDumpId],
  );

  const rowData = useMemo(() => {
    return data.map((crash) => {
      const isSelected = crash.dumpId === selectedDumpId;

      return new Map<CrashesTableColumnKey, CellDataType<CrashesTableActionType, string>>([
        [
          CrashesTableColumnKey.Timestamp,
          {
            type: ColumnType.Timestamp,
            value: crash.timestamp,
          },
        ],
        [
          CrashesTableColumnKey.ServerVersion,
          {
            type: ColumnType.Text,
            value: `${crash.engineVersion ?? NO_DATA_LABEL}`,
          },
        ],
        [
          CrashesTableColumnKey.ServerUptime,
          {
            type: ColumnType.Text,
            value: crash.serverUptime ? formatDurationInSecond(crash.serverUptime) : NO_DATA_LABEL,
          },
        ],
        [
          CrashesTableColumnKey.PlaceID,
          {
            type: ColumnType.Text,
            value: `${crash.placeId ?? NO_DATA_LABEL}`,
          },
        ],
        [
          CrashesTableColumnKey.PlaceVersion,
          {
            type: ColumnType.Text,
            value: `${crash.placeVersion ?? NO_DATA_LABEL}`,
          },
        ],
        [
          CrashesTableColumnKey.Actions,
          {
            type: ColumnType.Actions,
            actions: [
              {
                actionType: CrashesTableActionType.View,
                actionOn: crash.dumpId,
                onActionInvoked: () => handleSelectCrash(crash),
                displayLabel: isSelected
                  ? translate(translationKey('Action.Viewing', TranslationNamespace.Analytics))
                  : translate(translationKey('Action.View', TranslationNamespace.Analytics)),
                renderedAsInNonCompactTable: 'dedicated-button',
                disabled: isSelected,
                loading: isSelected && selectedCrashDumpFileState.isDataLoading,
              },
            ],
          },
        ],
      ]);
    });
  }, [
    data,
    selectedDumpId,
    selectedCrashDumpFileState.isDataLoading,
    translate,
    handleSelectCrash,
  ]);

  const pagination: GenericTablePaginationSpec = useMemo(
    () => ({
      page,
      total,
      pageSize,
      pageSizeOptions: PAGE_SIZE_OPTIONS,
      setPageSize,
      onNextPage: nextPage,
      onPreviousPage: previousPage,
      hasNext,
      hasPrevious,
    }),
    [page, total, pageSize, setPageSize, nextPage, previousPage, hasNext, hasPrevious],
  );

  const tableHeader = useMemo(
    () => (
      <ChartHeader
        title={translate(
          translationKey('Title.ServerOOMSnapshots', TranslationNamespace.Analytics),
        )}
        exportButton={null}
      />
    ),
    [translate],
  );

  const getRowKey = useCallback(
    (_: Map<CrashesTableColumnKey, CellDataType<CrashesTableActionType>>, index: number) =>
      `${data[index]?.dumpId}-${String(index)}`,
    [data],
  );

  const getIsRowSelected = useCallback(
    (_: Map<CrashesTableColumnKey, CellDataType<CrashesTableActionType>>, index: number) =>
      data[index]?.dumpId === selectedDumpId,
    [data, selectedDumpId],
  );

  return (
    <GenericTableV2
      columnConfigs={crashesTableColumnConfigs}
      rowData={rowData}
      tableHeader={tableHeader}
      isDataLoading={isDataLoading}
      isResponseFailed={isResponseFailed}
      isUserForbidden={isUserForbidden}
      showNoDataMessage={!isDataLoading && data.length === 0}
      pagination={pagination}
      tableConfig={{
        stickyHeader: true,
        hover: true,
        tableBorder: false,
        stickyLastColumn: true,
      }}
      getRowKey={getRowKey}
      getIsRowSelected={getIsRowSelected}
    />
  );
};

export default React.memo(ServerMemoryDumpsTable);

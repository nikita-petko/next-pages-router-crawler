import React, { FC, useMemo, useCallback, useState } from 'react';
import {
  GenericTableV2,
  ColumnType,
  CellDataType,
  TableColumnConfig,
  GenericTablePaginationSpec,
  ChartHeader,
} from '@modules/charts-generic';
import {
  useRAQIV2TranslationDependencies,
  RAQIV2ChartContext,
} from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { translationKey } from '@modules/analytics-translations';

enum AlertHistoryColumnKey {
  TimeTriggered = 'timeTriggered',
  TimeRecovered = 'timeRecovered',
  AlertName = 'alertName',
  ValueWhenTriggered = 'valueWhenTriggered',
  Description = 'description',
}

type AlertHistoryRow = {
  id: string;
  timeTriggered: string;
  timeRecovered: string | null;
  alertName: string;
  valueWhenTriggered: string;
  description: string;
};

const NO_DATA_LABEL = 'N/A';

const MOCK_DATA: AlertHistoryRow[] = [
  {
    id: '1',
    timeTriggered: '2025-09-07T07:50:32Z',
    timeRecovered: null,
    alertName: 'P10 Android crash rate',
    valueWhenTriggered: '50%',
    description: 'This is a description',
  },
  {
    id: '2',
    timeTriggered: '2025-09-07T07:40:12Z',
    timeRecovered: '2025-09-07T07:40:12Z',
    alertName: 'P10 Android crash rate',
    valueWhenTriggered: '42%',
    description: 'This is a description',
  },
  {
    id: '3',
    timeTriggered: '2025-09-07T07:38:45Z',
    timeRecovered: null,
    alertName: 'OS high crash rate',
    valueWhenTriggered: '4% (Android)\n5% (iOS)',
    description: 'This is a description',
  },
];

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];
const DEFAULT_PAGE_SIZE = 10;
const TOTAL_MOCK_ITEMS = 50;

const alertHistoryColumnConfigs: TableColumnConfig<AlertHistoryColumnKey>[] = [
  {
    columnKey: AlertHistoryColumnKey.TimeTriggered,
    columnType: ColumnType.Timestamp,
    titleKey: translationKey('Title.Table.TimeTriggered', TranslationNamespace.Analytics),
  },
  {
    columnKey: AlertHistoryColumnKey.TimeRecovered,
    columnType: ColumnType.Text,
    titleKey: translationKey('Title.Table.TimeRecovered', TranslationNamespace.Analytics),
  },
  {
    columnKey: AlertHistoryColumnKey.AlertName,
    columnType: ColumnType.Text,
    titleKey: translationKey('Title.Table.AlertName', TranslationNamespace.Analytics),
  },
  {
    columnKey: AlertHistoryColumnKey.ValueWhenTriggered,
    columnType: ColumnType.Text,
    titleKey: translationKey('Title.Table.ValueWhenTriggered', TranslationNamespace.Analytics),
  },
  {
    columnKey: AlertHistoryColumnKey.Description,
    columnType: ColumnType.Text,
    titleKey: translationKey('Title.Table.Description', TranslationNamespace.Analytics),
  },
];

const AlertHistoryTable: FC<{ chartContext: RAQIV2ChartContext }> = () => {
  const { translate } = useRAQIV2TranslationDependencies();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const rowData = useMemo(() => {
    return MOCK_DATA.map((alert) => {
      return new Map<AlertHistoryColumnKey, CellDataType>([
        [
          AlertHistoryColumnKey.TimeTriggered,
          {
            type: ColumnType.Timestamp,
            value: alert.timeTriggered,
          },
        ],
        [
          AlertHistoryColumnKey.TimeRecovered,
          {
            type: ColumnType.Text,
            value: alert.timeRecovered ?? NO_DATA_LABEL,
          },
        ],
        [
          AlertHistoryColumnKey.AlertName,
          {
            type: ColumnType.Text,
            value: alert.alertName,
          },
        ],
        [
          AlertHistoryColumnKey.ValueWhenTriggered,
          {
            type: ColumnType.Text,
            value: alert.valueWhenTriggered,
          },
        ],
        [
          AlertHistoryColumnKey.Description,
          {
            type: ColumnType.Text,
            value: alert.description,
          },
        ],
      ]);
    });
  }, []);

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

  const tableHeader = useMemo(
    () => (
      <ChartHeader
        title={translate(translationKey('Title.AlertHistory', TranslationNamespace.Analytics))}
        exportButton={null}
      />
    ),
    [translate],
  );

  const getRowKey = useCallback(
    (_: Map<AlertHistoryColumnKey, CellDataType>, index: number) =>
      `alert-history-${MOCK_DATA[index]?.id ?? String(index)}`,
    [],
  );

  return (
    <GenericTableV2
      columnConfigs={alertHistoryColumnConfigs}
      rowData={rowData}
      tableHeader={tableHeader}
      isDataLoading={false}
      isResponseFailed={false}
      isUserForbidden={false}
      showNoDataMessage={MOCK_DATA.length === 0}
      pagination={pagination}
      tableConfig={{
        stickyHeader: true,
      }}
      getRowKey={getRowKey}
    />
  );
};

export default React.memo(AlertHistoryTable);

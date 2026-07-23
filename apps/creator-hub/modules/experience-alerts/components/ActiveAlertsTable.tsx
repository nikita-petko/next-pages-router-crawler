import React, { FC, useMemo, useCallback, useState } from 'react';
import {
  GenericTableV2,
  ColumnType,
  CellDataType,
  TableColumnConfig,
  GenericTablePaginationSpec,
  ChartHeader,
  TableSortOrder,
} from '@modules/charts-generic';
import type { TBadgeVariant } from '@rbx/foundation-ui';
import {
  useRAQIV2TranslationDependencies,
  RAQIV2ChartContext,
} from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { translationKey } from '@modules/analytics-translations';
import { ExperienceAlertSeverity } from '../constants/types';

enum ActiveAlertsColumnKey {
  Timestamp = 'timestamp',
  Severity = 'severity',
  AlertName = 'alertName',
  CurrentValue = 'currentValue',
  Description = 'description',
  Actions = 'actions',
}

enum ActiveAlertsActionType {
  SeeMetric = 'seeMetric',
}

const SEVERITY_ORDER: Record<ExperienceAlertSeverity, number> = {
  [ExperienceAlertSeverity.Critical]: 3,
  [ExperienceAlertSeverity.Medium]: 2,
  [ExperienceAlertSeverity.Low]: 1,
};

const SEVERITY_BADGE_VARIANT: Record<ExperienceAlertSeverity, TBadgeVariant> = {
  [ExperienceAlertSeverity.Critical]: 'Alert',
  [ExperienceAlertSeverity.Medium]: 'Warning',
  [ExperienceAlertSeverity.Low]: 'Contrast',
};

type ActiveAlertRow = {
  id: string;
  timestamp: string;
  severity: ExperienceAlertSeverity;
  alertName: string;
  currentValue: string;
  description: string;
};

const MOCK_DATA: ActiveAlertRow[] = [
  {
    id: '1',
    timestamp: '2025-09-07T07:50:32Z',
    severity: ExperienceAlertSeverity.Critical,
    alertName: 'P10 Android crash rate',
    currentValue: '50%',
    description: 'This is a description',
  },
  {
    id: '2',
    timestamp: '2025-09-07T07:50:32Z',
    severity: ExperienceAlertSeverity.Medium,
    alertName: 'P10 Android crash rate',
    currentValue: '50%',
    description: 'This is a description',
  },
  {
    id: '3',
    timestamp: '2025-09-07T07:50:32Z',
    severity: ExperienceAlertSeverity.Low,
    alertName: 'P10 Android crash rate',
    currentValue: '50%',
    description: 'This is a description',
  },
  {
    id: '4',
    timestamp: '2025-09-07T07:50:32Z',
    severity: ExperienceAlertSeverity.Low,
    alertName: 'P10 Android crash rate',
    currentValue: '50% (Android)...',
    description: 'This is a description',
  },
];

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];
const DEFAULT_PAGE_SIZE = 10;
const TOTAL_MOCK_ITEMS = 50;

const ActiveAlertsTable: FC<{ chartContext: RAQIV2ChartContext }> = () => {
  const { translate } = useRAQIV2TranslationDependencies();
  const [sortOrder, setSortOrder] = useState<TableSortOrder>(TableSortOrder.desc);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const handleSortClick = useCallback(() => {
    setSortOrder((prev) =>
      prev === TableSortOrder.asc ? TableSortOrder.desc : TableSortOrder.asc,
    );
  }, []);

  const columnConfigs: TableColumnConfig<ActiveAlertsColumnKey>[] = useMemo(
    () => [
      {
        columnKey: ActiveAlertsColumnKey.Timestamp,
        columnType: ColumnType.Timestamp,
        titleKey: translationKey('Title.Table.Timestamp', TranslationNamespace.Analytics),
        endAdormentColumnKeyInCompactView: ActiveAlertsColumnKey.Actions,
      },
      {
        columnKey: ActiveAlertsColumnKey.Severity,
        columnType: ColumnType.Status,
        titleKey: translationKey('ErrorLogTable.Header.Severity', TranslationNamespace.Analytics),
        sort: {
          direction: sortOrder,
          onClick: handleSortClick,
        },
      },
      {
        columnKey: ActiveAlertsColumnKey.AlertName,
        columnType: ColumnType.Text,
        titleKey: translationKey('Title.Table.AlertName', TranslationNamespace.Analytics),
      },
      {
        columnKey: ActiveAlertsColumnKey.CurrentValue,
        columnType: ColumnType.Text,
        titleKey: translationKey('Title.Table.CurrentValue', TranslationNamespace.Analytics),
      },
      {
        columnKey: ActiveAlertsColumnKey.Description,
        columnType: ColumnType.Text,
        titleKey: translationKey('Title.Table.Description', TranslationNamespace.Analytics),
      },
      {
        columnKey: ActiveAlertsColumnKey.Actions,
        columnType: ColumnType.Actions,
        titleKey: translationKey('Title.Table.Actions', TranslationNamespace.Analytics),
        titleOverride: '',
      },
    ],
    [sortOrder, handleSortClick],
  );

  const sortedData = useMemo(() => {
    return [...MOCK_DATA].sort((a, b) => {
      const diff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      return sortOrder === TableSortOrder.asc ? diff : -diff;
    });
  }, [sortOrder]);

  const rowData = useMemo(() => {
    return sortedData.map((alert) => {
      return new Map<ActiveAlertsColumnKey, CellDataType<ActiveAlertsActionType>>([
        [
          ActiveAlertsColumnKey.Timestamp,
          {
            type: ColumnType.Timestamp,
            value: alert.timestamp,
          },
        ],
        [
          ActiveAlertsColumnKey.Severity,
          {
            type: ColumnType.Status,
            chipType: 'badge',
            variant: SEVERITY_BADGE_VARIANT[alert.severity],
            label: alert.severity,
          },
        ],
        [
          ActiveAlertsColumnKey.AlertName,
          {
            type: ColumnType.Text,
            value: alert.alertName,
          },
        ],
        [
          ActiveAlertsColumnKey.CurrentValue,
          {
            type: ColumnType.Text,
            value: alert.currentValue,
          },
        ],
        [
          ActiveAlertsColumnKey.Description,
          {
            type: ColumnType.Text,
            value: alert.description,
          },
        ],
        [
          ActiveAlertsColumnKey.Actions,
          {
            type: ColumnType.Actions,
            actions: [
              {
                actionType: ActiveAlertsActionType.SeeMetric,
                actionOn: alert.id,
                onActionInvoked: () => {},
                displayLabel: translate(
                  translationKey('Action.SeeMetric', TranslationNamespace.Analytics),
                ),
                renderedAsInNonCompactTable: 'dedicated-button',
              },
            ],
          },
        ],
      ]);
    });
  }, [sortedData, translate]);

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
        title={translate(translationKey('Title.ActiveAlerts', TranslationNamespace.Analytics))}
        exportButton={null}
      />
    ),
    [translate],
  );

  const getRowKey = useCallback(
    (_: Map<ActiveAlertsColumnKey, CellDataType<ActiveAlertsActionType>>, index: number) =>
      `active-alert-${sortedData[index]?.id ?? String(index)}`,
    [sortedData],
  );

  return (
    <GenericTableV2
      columnConfigs={columnConfigs}
      rowData={rowData}
      tableHeader={tableHeader}
      isDataLoading={false}
      isResponseFailed={false}
      isUserForbidden={false}
      showNoDataMessage={sortedData.length === 0}
      pagination={pagination}
      tableConfig={{
        stickyHeader: true,
        hover: true,
        stickyLastColumn: true,
      }}
      getRowKey={getRowKey}
    />
  );
};

export default React.memo(ActiveAlertsTable);

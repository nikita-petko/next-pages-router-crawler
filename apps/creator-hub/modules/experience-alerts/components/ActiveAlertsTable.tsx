import type { FC } from 'react';
import React, { useMemo, useCallback, useState } from 'react';
import { useRouter } from 'next/router';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { TBadgeVariant } from '@rbx/foundation-ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import ChartHeader from '@modules/charts-generic/charts/ChartHeader';
import type { GenericTablePaginationSpec } from '@modules/charts-generic/tables/GenericTablePagination';
import GenericTableV2 from '@modules/charts-generic/tables/GenericTableV2';
import type { TableColumnConfig } from '@modules/charts-generic/tables/types/GenericColumnType';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import type { CellDataType } from '@modules/charts-generic/tables/types/GenericTableType';
import { TableSortOrder } from '@modules/charts-generic/tables/types/TableSort';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import type RAQIV2ChartContext from '@modules/experience-analytics-shared/types/RAQIV2ChartContext';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  analyticsAlertSeverityTranslationKey,
  raqiSeverityFilterValuesToAnalyticsAlertSeverities,
} from '../constants/alertFormConstants';
import {
  AnalyticsAlertFiringStatus,
  AnalyticsAlertSeverity,
  type AnalyticsAlertDetail,
} from '../constants/types';
import useAnalyticsAlertsListQuery from '../hooks/useAnalyticsAlertsListQuery';
import { buildExploreModeUrlFromAlertDetail } from '../utils/alertExploreModeUrls';
import ActiveAlertCurrentValueCell from './ActiveAlertCurrentValueCell';
import type { AnalyticsAlertsListOptions } from './AnalyticsAlertClientProvider';

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

const SEVERITY_BADGE_VARIANT: Record<AnalyticsAlertSeverity, TBadgeVariant> = {
  [AnalyticsAlertSeverity.SEV_0]: 'Alert',
  [AnalyticsAlertSeverity.SEV_1]: 'Warning',
  [AnalyticsAlertSeverity.SEV_2]: 'Contrast',
};

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];
const DEFAULT_PAGE_SIZE = 10;

const ActiveAlertsTable: FC<{ chartContext: RAQIV2ChartContext }> = ({ chartContext }) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const { id: universeIdFallback } = useUniverseResource();
  const router = useRouter();
  const referrer = btoa(router.asPath);

  const [sortOrder, setSortOrder] = useState<TableSortOrder>(TableSortOrder.desc);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const {
    resource: { id: resourceId },
    filter,
  } = chartContext;

  const alertsListOptions = useMemo<AnalyticsAlertsListOptions>(() => {
    const rawSeverityValues = filter?.find((f) => f.dimension === RAQIV2Dimension.Severity)?.values;
    return {
      firingStatus: AnalyticsAlertFiringStatus.Firing,
      ids: filter?.find((f) => f.dimension === RAQIV2Dimension.AlertId)?.values.map(String),
      severities: rawSeverityValues
        ? raqiSeverityFilterValuesToAnalyticsAlertSeverities(rawSeverityValues)
        : undefined,
    };
  }, [filter]);

  const {
    data: firingAlerts = [],
    isLoading,
    isError,
  } = useAnalyticsAlertsListQuery(resourceId ?? universeIdFallback, alertsListOptions);

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
        titleKey: translationKey('Title.Table.TimeTriggered', TranslationNamespace.Analytics),
        endAdormentColumnKeyInCompactView: ActiveAlertsColumnKey.Actions,
      },
      {
        columnKey: ActiveAlertsColumnKey.Severity,
        columnType: ColumnType.Status,
        titleKey: translationKey('Label.Severity', TranslationNamespace.ExperienceAlerts),
        sort: {
          direction: sortOrder,
          onClick: handleSortClick,
        },
      },
      {
        columnKey: ActiveAlertsColumnKey.AlertName,
        columnType: ColumnType.Text,
        titleKey: translationKey('Label.AlertName', TranslationNamespace.ExperienceAlerts),
      },
      {
        columnKey: ActiveAlertsColumnKey.CurrentValue,
        columnType: ColumnType.Other,
        titleKey: translationKey('Title.Table.CurrentValue', TranslationNamespace.ExperienceAlerts),
      },
      {
        columnKey: ActiveAlertsColumnKey.Description,
        columnType: ColumnType.Text,
        titleKey: translationKey('Label.AlertDescription', TranslationNamespace.ExperienceAlerts),
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
    return [...firingAlerts].sort((a, b) => {
      // Lex-sort on the BE wire strings (`"SEV_0"` / `"SEV_1"` / `"SEV_2"`)
      // happens to match the desired most-to-least-severe ordering
      // because of the numeric suffix.
      const diff = a.severity.localeCompare(b.severity);
      return sortOrder === TableSortOrder.asc ? -diff : diff;
    });
  }, [firingAlerts, sortOrder]);

  const pagedAlerts = useMemo(() => {
    const start = page * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize]);

  const rowData = useMemo(() => {
    return pagedAlerts.map((alert: AnalyticsAlertDetail) => {
      const severityLabel = translate(analyticsAlertSeverityTranslationKey(alert.severity));
      return new Map<ActiveAlertsColumnKey, CellDataType<ActiveAlertsActionType>>([
        [
          ActiveAlertsColumnKey.Timestamp,
          {
            type: ColumnType.Timestamp,
            value: alert.lastFiredAt ?? NaN,
          },
        ],
        [
          ActiveAlertsColumnKey.Severity,
          {
            type: ColumnType.Status,
            chipType: 'badge',
            variant: SEVERITY_BADGE_VARIANT[alert.severity],
            label: severityLabel,
          },
        ],
        [
          ActiveAlertsColumnKey.AlertName,
          {
            type: ColumnType.Text,
            value: alert.name,
          },
        ],
        [
          ActiveAlertsColumnKey.CurrentValue,
          {
            type: ColumnType.Other,
            value: <ActiveAlertCurrentValueCell alert={alert} />,
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
                actionOn: alert.alertId,
                href: buildExploreModeUrlFromAlertDetail(alert, referrer),
                onActionInvoked: () => {},
                displayLabel: translate(
                  translationKey('Action.SeeMetric', TranslationNamespace.ExperienceAlerts),
                ),
                renderedAsInNonCompactTable: 'dedicated-button',
              },
            ],
          },
        ],
      ]);
    });
  }, [pagedAlerts, translate, referrer]);

  const pagination: GenericTablePaginationSpec = useMemo(
    () => ({
      page,
      total: sortedData.length,
      pageSize,
      pageSizeOptions: PAGE_SIZE_OPTIONS,
      setPageSize: (newSize: number) => {
        setPageSize(newSize);
        setPage(0);
      },
      onNextPage: () => setPage((p) => p + 1),
      onPreviousPage: () => setPage((p) => Math.max(0, p - 1)),
      hasNext: (page + 1) * pageSize < sortedData.length,
      hasPrevious: page > 0,
    }),
    [page, pageSize, sortedData.length],
  );

  const tableHeader = useMemo(
    () => (
      <ChartHeader
        title={translate(
          translationKey('Title.ActiveAlerts', TranslationNamespace.ExperienceAlerts),
        )}
        exportButton={null}
      />
    ),
    [translate],
  );

  const getRowKey = useCallback(
    (_: Map<ActiveAlertsColumnKey, CellDataType<ActiveAlertsActionType>>, index: number) =>
      `active-alert-${pagedAlerts[index]?.alertId ?? index}`,
    [pagedAlerts],
  );

  return (
    <GenericTableV2
      columnConfigs={columnConfigs}
      rowData={rowData}
      tableHeader={tableHeader}
      isDataLoading={isLoading}
      isResponseFailed={isError}
      isUserForbidden={false}
      showNoDataMessage={!isLoading && !isError && sortedData.length === 0}
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

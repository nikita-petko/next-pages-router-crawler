import type { FC } from 'react';
import React, { useMemo, useCallback, useState } from 'react';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import ChartHeader from '@modules/charts-generic/charts/ChartHeader';
import type { GenericTablePaginationSpec } from '@modules/charts-generic/tables/GenericTablePagination';
import GenericTableV2 from '@modules/charts-generic/tables/GenericTableV2';
import type { TableColumnConfig } from '@modules/charts-generic/tables/types/GenericColumnType';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import type { CellDataType } from '@modules/charts-generic/tables/types/GenericTableType';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import type RAQIV2ChartContext from '@modules/experience-analytics-shared/types/RAQIV2ChartContext';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { raqiSeverityFilterValuesToAnalyticsAlertSeverities } from '../constants/alertFormConstants';
import type { AnalyticsAlertIncidentDetail } from '../constants/types';
import useAnalyticsAlertIncidentsQuery from '../hooks/useAnalyticsAlertIncidentsQuery';
import { formatIncidentFiringConditions } from '../utils/analyticsAlertFormUtils';
import type { AnalyticsAlertIncidentsListOptions } from './AnalyticsAlertClientProvider';

enum AlertHistoryColumnKey {
  TimeTriggered = 'timeTriggered',
  TimeRecovered = 'timeRecovered',
  AlertName = 'alertName',
  ValueWhenTriggered = 'valueWhenTriggered',
  Description = 'description',
}

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];
const DEFAULT_PAGE_SIZE = 10;

const alertHistoryColumnConfigs: TableColumnConfig<AlertHistoryColumnKey>[] = [
  {
    columnKey: AlertHistoryColumnKey.TimeTriggered,
    columnType: ColumnType.Timestamp,
    titleKey: translationKey('Title.Table.TimeTriggered', TranslationNamespace.ExperienceAlerts),
  },
  {
    columnKey: AlertHistoryColumnKey.TimeRecovered,
    columnType: ColumnType.Timestamp,
    titleKey: translationKey('Title.Table.TimeRecovered', TranslationNamespace.ExperienceAlerts),
  },
  {
    columnKey: AlertHistoryColumnKey.AlertName,
    columnType: ColumnType.Text,
    titleKey: translationKey('Label.AlertName', TranslationNamespace.ExperienceAlerts),
  },
  {
    columnKey: AlertHistoryColumnKey.ValueWhenTriggered,
    columnType: ColumnType.Other,
    titleKey: translationKey(
      'Title.Table.ValueWhenTriggered',
      TranslationNamespace.ExperienceAlerts,
    ),
  },
  {
    columnKey: AlertHistoryColumnKey.Description,
    columnType: ColumnType.Text,
    titleKey: translationKey('Label.AlertDescription', TranslationNamespace.ExperienceAlerts),
  },
];

const AlertHistoryTable: FC<{ chartContext: RAQIV2ChartContext }> = ({ chartContext }) => {
  const translationDependencies = useRAQIV2TranslationDependencies();
  const { translate } = translationDependencies;
  const { id: universeIdFallback } = useUniverseResource();
  const universeId = chartContext.resource.id ?? universeIdFallback;

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const incidentsListOptions = useMemo<AnalyticsAlertIncidentsListOptions>(() => {
    const rawSeverityValues = chartContext.filter?.find(
      (f) => f.dimension === RAQIV2Dimension.Severity,
    )?.values;
    return {
      alertIds: chartContext.filter
        ?.find((f) => f.dimension === RAQIV2Dimension.AlertId)
        ?.values.map(String),
      severities: rawSeverityValues
        ? raqiSeverityFilterValuesToAnalyticsAlertSeverities(rawSeverityValues)
        : undefined,
    };
  }, [chartContext.filter]);

  const {
    data: incidents = [],
    isLoading,
    isError,
  } = useAnalyticsAlertIncidentsQuery(universeId, chartContext, incidentsListOptions);

  const pagedIncidents = useMemo(() => {
    const start = page * pageSize;
    return incidents.slice(start, start + pageSize);
  }, [incidents, page, pageSize]);

  const rowData = useMemo(() => {
    return pagedIncidents.map((incident: AnalyticsAlertIncidentDetail) => {
      const firingLines = formatIncidentFiringConditions(
        incident.latestFiringMetadata,
        incident.metric,
        translationDependencies,
      );
      return new Map<AlertHistoryColumnKey, CellDataType>([
        [
          AlertHistoryColumnKey.TimeTriggered,
          {
            type: ColumnType.Timestamp,
            value: incident.openedAt,
          },
        ],
        [
          AlertHistoryColumnKey.TimeRecovered,
          {
            type: ColumnType.Timestamp,
            value: incident.resolvedAt ?? NaN,
          },
        ],
        [
          AlertHistoryColumnKey.AlertName,
          {
            type: ColumnType.Text,
            value: incident.alertName,
          },
        ],
        [
          AlertHistoryColumnKey.ValueWhenTriggered,
          {
            type: ColumnType.Other,
            value:
              firingLines.length > 0 ? (
                <>
                  {firingLines.map((line, index) => (
                    // eslint-disable-next-line react/no-array-index-key -- formatted line text may repeat; index disambiguates
                    <div key={`${incident.id}-firing-line-${index}`}>{line}</div>
                  ))}
                </>
              ) : (
                translate(translationKey('Label.NoData', TranslationNamespace.Analytics))
              ),
          },
        ],
        [
          AlertHistoryColumnKey.Description,
          {
            type: ColumnType.Text,
            value: incident.description,
          },
        ],
      ]);
    });
  }, [pagedIncidents, translationDependencies, translate]);

  const pagination: GenericTablePaginationSpec = useMemo(
    () => ({
      page,
      total: incidents.length,
      pageSize,
      pageSizeOptions: PAGE_SIZE_OPTIONS,
      setPageSize: (newSize: number) => {
        setPageSize(newSize);
        setPage(0);
      },
      onNextPage: () => setPage((p) => p + 1),
      onPreviousPage: () => setPage((p) => Math.max(0, p - 1)),
      hasNext: (page + 1) * pageSize < incidents.length,
      hasPrevious: page > 0,
    }),
    [page, pageSize, incidents.length],
  );

  const tableHeader = useMemo(
    () => (
      <ChartHeader
        title={translate(
          translationKey('Title.AlertHistory', TranslationNamespace.ExperienceAlerts),
        )}
        exportButton={null}
      />
    ),
    [translate],
  );

  const getRowKey = useCallback(
    (_: Map<AlertHistoryColumnKey, CellDataType>, index: number) =>
      `alert-history-${pagedIncidents[index]?.id ?? index}`,
    [pagedIncidents],
  );

  return (
    <GenericTableV2
      columnConfigs={alertHistoryColumnConfigs}
      rowData={rowData}
      tableHeader={tableHeader}
      isDataLoading={isLoading}
      isResponseFailed={isError}
      isUserForbidden={false}
      showNoDataMessage={!isLoading && !isError && incidents.length === 0}
      pagination={pagination}
      tableConfig={{
        stickyHeader: true,
      }}
      getRowKey={getRowKey}
    />
  );
};

export default React.memo(AlertHistoryTable);

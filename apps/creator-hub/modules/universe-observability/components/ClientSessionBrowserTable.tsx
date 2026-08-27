import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import NextLink from 'next/link';
import { StatusBadge } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { GenericTablePaginationSpec } from '@modules/charts-generic/tables/GenericTablePagination';
import GenericTableV2 from '@modules/charts-generic/tables/GenericTableV2';
import useLocalPaginatedAdapter from '@modules/charts-generic/tables/hooks/useLocalPaginatedAdapter';
import type { TableColumnConfig } from '@modules/charts-generic/tables/types/GenericColumnType';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import type { CellDataType } from '@modules/charts-generic/tables/types/GenericTableType';
import type {
  PlaySessionQueryOptions,
  UniversePlaySession,
} from '@modules/clients/analytics/universeSessionMetadataApi';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import useClientSessions from '../hooks/useClientSessions';
import useClientSessionStatusLabels from '../hooks/useClientSessionStatusLabels';
import {
  CLIENT_SESSION_DURATION_FORMATTING_SPEC,
  CLIENT_SESSION_MEMORY_USAGE_FORMATTING_SPEC,
  CLIENT_SESSION_MIN_FPS_FORMATTING_SPEC,
  CLIENT_SESSION_START_TIME_FORMAT_OPTIONS,
  durationMillisecondsToMinutes,
  formatDeviceLabel,
  formatPlaceLabel,
} from '../utils/clientSessionFormatters';
import { CLIENT_SESSION_STATUS_BADGE_VARIANTS } from '../utils/clientSessionStatusBadgeVariants';

const DEFAULT_PAGE_SIZE = 10;
const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

// GenericTableV2 throws when a cell's type differs from its column's, so absent numbers and
// timestamps are signalled with the sentinels formatCellContent already renders as empty:
// NaN for numbers and an unparseable date for timestamps.
const MISSING_TIMESTAMP = new Date(Number.NaN);

enum ClientSessionBrowserColumnKey {
  Status = 'status',
  SessionId = 'sessionId',
  Device = 'device',
  SessionStart = 'sessionStart',
  SessionDuration = 'sessionDuration',
  MinFps = 'minFps',
  MaxMemoryUsage = 'maxMemoryUsage',
  Place = 'place',
}

type ClientSessionBrowserRow = Map<ClientSessionBrowserColumnKey, CellDataType>;

type ClientSessionBrowserTableProps = {
  readonly universeId: number;
  readonly queryOptions: PlaySessionQueryOptions;
};

const numberCell = (value: number | null): CellDataType => ({
  type: ColumnType.Number,
  value: value ?? Number.NaN,
});

const ClientSessionBrowserTable: FC<ClientSessionBrowserTableProps> = ({
  universeId,
  queryOptions,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { data, isError, isPending } = useClientSessions({ universeId, ...queryOptions });
  const statusLabels = useClientSessionStatusLabels();
  const raqiTranslationDependencies = useRAQIV2TranslationDependencies();

  const columnLabels = useMemo(
    () => ({
      status: tPendingTranslation(
        'Status',
        'Column heading for a client session status.',
        translationKey('Label.ClientSessionBrowserStatus', TranslationNamespace.ServerManagement),
      ),
      sessionId: tPendingTranslation(
        'Session ID',
        'Column heading for a client session identifier.',
        translationKey(
          'Label.ClientSessionBrowserSessionId',
          TranslationNamespace.ServerManagement,
        ),
      ),
      device: tPendingTranslation(
        'Device info',
        'Column heading for the device a client session ran on.',
        translationKey('Label.ClientSessionBrowserDevice', TranslationNamespace.ServerManagement),
      ),
      sessionStart: tPendingTranslation(
        'Session start (UTC)',
        'Column heading for when a client session started.',
        translationKey(
          'Label.ClientSessionBrowserSessionStart',
          TranslationNamespace.ServerManagement,
        ),
      ),
      sessionDuration: tPendingTranslation(
        'Session duration',
        'Column heading for how long a client session lasted.',
        translationKey(
          'Label.ClientSessionBrowserSessionDuration',
          TranslationNamespace.ServerManagement,
        ),
      ),
      minFps: tPendingTranslation(
        'Min FPS',
        'Label for the lowest frames per second during a client session.',
        translationKey('Label.ClientSessionMetadataMinFps', TranslationNamespace.ServerManagement),
      ),
      maxMemoryUsage: tPendingTranslation(
        'Max memory usage',
        'Column heading for the peak memory usage reached during a client session.',
        translationKey(
          'Label.ClientSessionBrowserMaxMemoryUsage',
          TranslationNamespace.ServerManagement,
        ),
      ),
      place: tPendingTranslation(
        'Place name and version',
        'Column heading for the place and version a client session ran.',
        translationKey('Label.ClientSessionBrowserPlace', TranslationNamespace.ServerManagement),
      ),
    }),
    [tPendingTranslation],
  );

  const columnConfigs = useMemo<TableColumnConfig<ClientSessionBrowserColumnKey>[]>(
    () => [
      {
        columnKey: ClientSessionBrowserColumnKey.Status,
        // Design calls for StatusBadge; ColumnType.Status renders a plain Badge without the status dot.
        columnType: ColumnType.Other,
        titleKey: columnLabels.status,
      },
      {
        columnKey: ClientSessionBrowserColumnKey.SessionId,
        columnType: ColumnType.Other,
        titleKey: columnLabels.sessionId,
      },
      {
        columnKey: ClientSessionBrowserColumnKey.Device,
        columnType: ColumnType.Text,
        titleKey: columnLabels.device,
      },
      {
        columnKey: ClientSessionBrowserColumnKey.SessionStart,
        columnType: ColumnType.Timestamp,
        titleKey: columnLabels.sessionStart,
      },
      {
        columnKey: ClientSessionBrowserColumnKey.SessionDuration,
        columnType: ColumnType.Number,
        titleKey: columnLabels.sessionDuration,
        analyticsNumberFormattingSpec: CLIENT_SESSION_DURATION_FORMATTING_SPEC,
      },
      {
        columnKey: ClientSessionBrowserColumnKey.MinFps,
        columnType: ColumnType.Number,
        titleKey: columnLabels.minFps,
        analyticsNumberFormattingSpec: CLIENT_SESSION_MIN_FPS_FORMATTING_SPEC,
      },
      {
        columnKey: ClientSessionBrowserColumnKey.MaxMemoryUsage,
        columnType: ColumnType.Number,
        titleKey: columnLabels.maxMemoryUsage,
        analyticsNumberFormattingSpec: CLIENT_SESSION_MEMORY_USAGE_FORMATTING_SPEC,
      },
      {
        columnKey: ClientSessionBrowserColumnKey.Place,
        columnType: ColumnType.Text,
        titleKey: columnLabels.place,
      },
    ],
    [columnLabels],
  );

  const sessions = useMemo<UniversePlaySession[]>(() => [...(data ?? [])], [data]);
  const {
    paginatedData,
    page,
    pageSize,
    total,
    onNextPage,
    onPreviousPage,
    setPageSize,
    hasNext,
    hasPrevious,
  } = useLocalPaginatedAdapter(sessions, DEFAULT_PAGE_SIZE);

  const rowData = useMemo<ClientSessionBrowserRow[]>(
    () =>
      paginatedData.map((session: UniversePlaySession) => {
        const statusLabel = statusLabels[session.exitReason];
        const deviceLabel = formatDeviceLabel(session, raqiTranslationDependencies);
        const placeLabel = formatPlaceLabel(
          session.placeName,
          session.placeVersion,
          raqiTranslationDependencies,
        );
        const sessionDetailsHref = dashboard.getClientSessionDetailsUrl(
          universeId,
          session.playSessionId,
        );
        const durationMinutes = durationMillisecondsToMinutes(session.durationMilliseconds);

        return new Map<ClientSessionBrowserColumnKey, CellDataType>([
          [
            ClientSessionBrowserColumnKey.Status,
            {
              type: ColumnType.Other,
              value: (
                <StatusBadge
                  label={statusLabel}
                  variant={CLIENT_SESSION_STATUS_BADGE_VARIANTS[session.exitReason]}
                  size='Small'
                />
              ),
            },
          ],
          [
            ClientSessionBrowserColumnKey.SessionId,
            {
              type: ColumnType.Other,
              value: (
                <NextLink
                  href={sessionDetailsHref}
                  className='content-inherit no-underline hover:underline'>
                  {session.playSessionId}
                </NextLink>
              ),
            },
          ],
          [
            ClientSessionBrowserColumnKey.Device,
            {
              type: ColumnType.Text,
              value: deviceLabel,
            },
          ],
          [
            ClientSessionBrowserColumnKey.SessionStart,
            {
              type: ColumnType.Timestamp,
              value: session.startedTime ?? MISSING_TIMESTAMP,
              format: CLIENT_SESSION_START_TIME_FORMAT_OPTIONS,
            },
          ],
          [ClientSessionBrowserColumnKey.SessionDuration, numberCell(durationMinutes)],
          [ClientSessionBrowserColumnKey.MinFps, numberCell(session.minFps)],
          [
            ClientSessionBrowserColumnKey.MaxMemoryUsage,
            numberCell(session.clientUsedMemoryMegabytes),
          ],
          [
            ClientSessionBrowserColumnKey.Place,
            {
              type: ColumnType.Text,
              value: placeLabel,
            },
          ],
        ]);
      }),
    [paginatedData, raqiTranslationDependencies, statusLabels, universeId],
  );

  const getRowKey = useCallback(
    (_rowInfo: ClientSessionBrowserRow, index: number) =>
      paginatedData[index]?.playSessionId ?? String(index),
    [paginatedData],
  );

  const pagination = useMemo<GenericTablePaginationSpec>(
    () => ({
      page,
      total,
      pageSize,
      pageSizeOptions: ROWS_PER_PAGE_OPTIONS,
      setPageSize,
      onNextPage,
      onPreviousPage,
      hasNext,
      hasPrevious,
    }),
    [hasNext, hasPrevious, onNextPage, onPreviousPage, page, pageSize, setPageSize, total],
  );

  return (
    <GenericTableV2
      columnConfigs={columnConfigs}
      getRowKey={getRowKey}
      isDataLoading={isPending}
      isResponseFailed={isError}
      isUserForbidden={false}
      pagination={pagination}
      rowData={rowData}
      showNoDataMessage={!isPending && sessions.length === 0}
      tableConfig={{ hover: true, stickyHeader: true }}
    />
  );
};

export default withNamespaceSwitchedTranslation(ClientSessionBrowserTable, [
  TranslationNamespace.Analytics,
  TranslationNamespace.ServerManagement,
  TranslationNamespace.Table,
]);

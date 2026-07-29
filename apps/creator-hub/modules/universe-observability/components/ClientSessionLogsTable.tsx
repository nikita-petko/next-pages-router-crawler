/* oxlint-disable typescript/no-deprecated -- Client Sessions explicitly opts into evaluating the experimental AdaptiveDataTable. */

import type { FC } from 'react';
import { useCallback, useMemo, useState } from 'react';
import type { AdaptiveDataTableValueCell } from '@rbx/analytics-ui';
import { AdaptiveDataTable } from '@rbx/analytics-ui';
import { Badge } from '@rbx/foundation-ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useClientLogs from '../hooks/useClientLogs';
import type { ClientSessionLog } from '../types/ClientSession';
import type { DateRangeSelection } from '../types/Filters';
import { LogSeverity } from '../types/LogSeverity';
import { getLogFilter } from '../utils/logFilters';
import DateRangeControl from './DateRangeControl';
import LogSearchInput from './LogSearchInput';
import SeveritySelector from './SeveritySelector';

const PAGE_SIZE = 50;
const CLIENT_LOG_SEVERITIES = [
  LogSeverity.Output,
  LogSeverity.Info,
  LogSeverity.Warning,
  LogSeverity.Error,
] as const;

const DATE_TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  dateStyle: 'medium',
  timeStyle: 'short',
};

const SEVERITY_BADGE_VARIANTS = {
  [LogSeverity.Output]: 'Neutral',
  [LogSeverity.Info]: 'Standard',
  [LogSeverity.Warning]: 'Warning',
  [LogSeverity.Error]: 'Alert',
} as const;

type ClientLogRow = {
  readonly time: AdaptiveDataTableValueCell<string>;
  readonly severity: AdaptiveDataTableValueCell<string>;
  readonly message: AdaptiveDataTableValueCell<string>;
};

type ClientSessionLogsTableProps = {
  readonly universeId: number | undefined;
  readonly sessionId: string | undefined;
};

const getRowId = (row: ClientLogRow): string => row.time.value;

const ClientSessionLogsTable: FC<ClientSessionLogsTableProps> = ({ universeId, sessionId }) => {
  const { locale } = useLocalization();
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const [dateRangeSelection, setDateRangeSelection] = useState<DateRangeSelection>({
    preset: 'all',
  });
  const [severity, setSeverity] = useState<LogSeverity>();
  const [logSearchKey, setLogSearchKey] = useState('');
  const filter = useMemo(
    () => getLogFilter(dateRangeSelection, severity, logSearchKey),
    [dateRangeSelection, logSearchKey, severity],
  );
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchNextPageError,
    isFetchingNextPage,
    isPending,
  } = useClientLogs({
    universeId,
    sessionId,
    pageSize: PAGE_SIZE,
    filter,
  });

  const timeFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale ?? Locale.English, DATE_TIME_FORMAT_OPTIONS),
    [locale],
  );
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale ?? Locale.English), [locale]);
  const columnLabels = useMemo(
    () => ({
      time: tPendingTranslation(
        'Time',
        'Column heading for the time when a client session log was created.',
        translationKey('Label.ClientSessionLogTime', TranslationNamespace.ServerManagement),
      ),
      severity: tPendingTranslation(
        'Severity',
        'Column heading for the severity of a client session log.',
        translationKey('Label.ClientSessionLogSeverity', TranslationNamespace.ServerManagement),
      ),
      message: tPendingTranslation(
        'Message',
        'Column heading for a client session log message.',
        translationKey('Label.ClientSessionLogMessage', TranslationNamespace.ServerManagement),
      ),
    }),
    [tPendingTranslation],
  );
  const severityLabels = useMemo(
    () => ({
      [LogSeverity.Output]: tPendingTranslation(
        'Output',
        'Output severity label for a client session log.',
        translationKey(
          'Label.ClientSessionLogSeverity.Output',
          TranslationNamespace.ServerManagement,
        ),
      ),
      [LogSeverity.Info]: tPendingTranslation(
        'Info',
        'Informational severity label for a client session log.',
        translationKey(
          'Label.ClientSessionLogSeverity.Info',
          TranslationNamespace.ServerManagement,
        ),
      ),
      [LogSeverity.Warning]: tPendingTranslation(
        'Warning',
        'Warning severity label for a client session log.',
        translationKey(
          'Label.ClientSessionLogSeverity.Warning',
          TranslationNamespace.ServerManagement,
        ),
      ),
      [LogSeverity.Error]: tPendingTranslation(
        'Error',
        'Error severity label for a client session log.',
        translationKey(
          'Label.ClientSessionLogSeverity.Error',
          TranslationNamespace.ServerManagement,
        ),
      ),
    }),
    [tPendingTranslation],
  );
  const logs = useMemo(() => data?.pages.flatMap((page) => page.logs) ?? [], [data?.pages]);
  const rows = useMemo<ClientLogRow[]>(
    () =>
      logs.map((log: ClientSessionLog) => {
        const severityLabel = severityLabels[log.severity];
        return {
          time: {
            type: 'value',
            header: columnLabels.time,
            value: log.id,
            displayString: () => timeFormatter.format(log.createTime),
            sortable: false,
          },
          severity: {
            type: 'value',
            header: columnLabels.severity,
            value: severityLabel,
            renderContainer: () => (
              <Badge
                label={severityLabel}
                size='Small'
                variant={SEVERITY_BADGE_VARIANTS[log.severity]}
              />
            ),
            sortable: false,
          },
          message: {
            type: 'value',
            header: columnLabels.message,
            value: log.message,
            sortable: false,
          },
        };
      }),
    [columnLabels, logs, severityLabels, timeFormatter],
  );
  const tableLabels = useMemo(
    () => ({
      loading: tPendingTranslation(
        'Loading client logs',
        'Accessible loading label for the client session logs table.',
        translationKey('Label.LoadingClientSessionLogs', TranslationNamespace.ServerManagement),
      ),
      error: tPendingTranslation(
        'Client logs could not be loaded.',
        'Error shown when client session logs fail to load.',
        translationKey('Message.ClientSessionLogsLoadError', TranslationNamespace.ServerManagement),
      ),
      emptyState: tPendingTranslation(
        'No client logs found.',
        'Empty state shown when a client session has no logs.',
        translationKey('Message.NoClientSessionLogs', TranslationNamespace.ServerManagement),
      ),
      retry: tPendingTranslation(
        'Retry',
        'Action to retry loading client session logs.',
        translationKey('Action.RetryClientSessionLogs', TranslationNamespace.ServerManagement),
      ),
      previousPage: tPendingTranslation(
        'Previous page',
        'Accessible label for the previous client session logs page button.',
        translationKey(
          'Action.PreviousClientSessionLogsPage',
          TranslationNamespace.ServerManagement,
        ),
      ),
      nextPage: tPendingTranslation(
        'Next page',
        'Accessible label for the next client session logs page button.',
        translationKey('Action.NextClientSessionLogsPage', TranslationNamespace.ServerManagement),
      ),
      page: (currentPageIndex: number, pageSize: number, totalRowCount = 0) => {
        const start = totalRowCount === 0 ? 0 : currentPageIndex * pageSize + 1;
        const end = Math.min((currentPageIndex + 1) * pageSize, totalRowCount);
        return tPendingTranslation(
          '{start}-{end} of {total}',
          'Range label below the client session logs table.',
          translationKey('Label.ClientSessionLogsPageRange', TranslationNamespace.ServerManagement),
          {
            start: numberFormatter.format(start),
            end: numberFormatter.format(end),
            total: numberFormatter.format(totalRowCount),
          },
        );
      },
    }),
    [numberFormatter, tPendingTranslation],
  );

  const handleDateRangeChange = useCallback((selection: DateRangeSelection) => {
    setDateRangeSelection(selection);
  }, []);
  const handleSeverityChange = useCallback((nextSeverity: LogSeverity | undefined) => {
    setSeverity(nextSeverity);
  }, []);
  const handleLogSearchChange = useCallback((nextLogSearchKey: string) => {
    setLogSearchKey(nextLogSearchKey);
  }, []);
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage({ cancelRefetch: false });
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  const lastPage = data?.pages[data.pages.length - 1];
  const navigation = useMemo(
    () => ({
      mode: 'infinite' as const,
      nextCursor: lastPage?.nextPageToken ?? null,
      onLoadMore: handleLoadMore,
      isLoadingMore: isFetchingNextPage,
      isLoadMoreError: isFetchNextPageError,
    }),
    [handleLoadMore, isFetchNextPageError, isFetchingNextPage, lastPage?.nextPageToken],
  );
  const tableResetKey = useMemo(
    () => JSON.stringify({ universeId, sessionId, filter }),
    [filter, sessionId, universeId],
  );

  return (
    <div className='flex flex-col gap-medium'>
      <div className='flex flex-col gap-medium width-full large:flex-row'>
        <DateRangeControl value={dateRangeSelection} onChange={handleDateRangeChange} />
        <SeveritySelector
          allowedSeverities={CLIENT_LOG_SEVERITIES}
          value={severity}
          onChange={handleSeverityChange}
        />
        <LogSearchInput value={logSearchKey} onDebouncedChange={handleLogSearchChange} />
      </div>
      <AdaptiveDataTable
        key={tableResetKey}
        getRowId={getRowId}
        isError={isError}
        isLoading={isPending || !sessionId || universeId == null || universeId <= 0}
        labels={tableLabels}
        navigation={navigation}
        rows={rows}
        size='Medium'
      />
    </div>
  );
};

export default withNamespaceSwitchedTranslation(ClientSessionLogsTable, [
  TranslationNamespace.ServerManagement,
]);

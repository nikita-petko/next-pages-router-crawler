import type { FunctionComponent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Dropdown, Menu, MenuItem, ProgressCircle, TextInput } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@rbx/ui';
import { POLLING_CONSTANTS } from '../../../constants';
import useDebounce from '../../../hooks/useDebounce';
import useGameServerLogs from '../../../hooks/useGameServerLogs';
import type { GameServerLogFilters, LogSeverityFilter } from '../../../types/GameServerLogControls';
import {
  syncLogFilterStateToUrl,
  urlParamsToLogFilterState,
} from '../../../utils/urlLogFilterParams';
import ServerLogRow from './ServerLogRow';
import ServerLogsDateRangeControl from './ServerLogsDateRangeControl';
import type {
  ServerLogDateRangePreset,
  ServerLogDateRangeSelection,
} from './ServerLogsDateRangeControl';

export type LogSeverityFilterOption = 'all' | 'warning' | 'error';

const LOG_SEVERITY_FILTER_OPTIONS: LogSeverityFilterOption[] = ['all', 'warning', 'error'];

const LOG_SEVERITY_FILTER_VALUES: Record<LogSeverityFilterOption, LogSeverityFilter | undefined> = {
  all: undefined,
  warning: { output: false, info: false, warning: true, error: false },
  error: { output: false, info: false, warning: false, error: true },
};

// Translation keys for each option label (resolved against the ServerManagement namespace).
const LOG_SEVERITY_FILTER_LABEL_KEYS = {
  all: 'ServerDetailsPage.Logs.Severity.All',
  warning: 'ServerDetailsPage.Logs.Severity.Warning',
  error: 'ServerDetailsPage.Logs.Severity.Error',
} as const satisfies Record<LogSeverityFilterOption, string>;

// Ordered list of date range preset options shown in the logs date range control.
const DATE_RANGE_PRESET_OPTIONS: ServerLogDateRangePreset[] = [
  'all',
  'last1Hour',
  'last1Day',
  'last7Days',
  'custom',
];

export interface ServerLogsListProps {
  placeId?: number;
  jobId?: string;
}

const ServerLogsList: FunctionComponent<ServerLogsListProps> = ({ placeId, jobId }) => {
  const { translateWithNamespace } = useTranslation();

  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  });

  const [rawSearch, setRawSearch] = useState('');
  const [severityOption, setSeverityOption] = useState<LogSeverityFilterOption>('all');
  const [dateRangeSelection, setDateRangeSelection] = useState<ServerLogDateRangeSelection>({
    preset: 'all',
  });
  const debouncedSearch = useDebounce(rawSearch, POLLING_CONSTANTS.DEBOUNCE_DELAY_MS);

  // Restore filter state from the URL once the router is ready. Done during render
  // (guarded so it runs a single time) rather than in an effect to avoid a cascading
  // setState-in-effect.
  const [logsUrlReady, setLogsUrlReady] = useState(false);
  if (!logsUrlReady && router.isReady) {
    const parsed = urlParamsToLogFilterState(router.query);
    if (parsed.search != null) {
      setRawSearch(parsed.search);
    }
    if (parsed.severityOption != null) {
      setSeverityOption(parsed.severityOption);
    }
    if (parsed.dateRangeSelection != null) {
      setDateRangeSelection(parsed.dateRangeSelection);
    }
    setLogsUrlReady(true);
  }

  // The data fetch is debounced, but the URL reflects the raw search immediately.
  useEffect(() => {
    if (!logsUrlReady) {
      return;
    }
    syncLogFilterStateToUrl(routerRef.current, {
      search: rawSearch,
      severityOption,
      dateRangeSelection,
    });
  }, [rawSearch, severityOption, dateRangeSelection, logsUrlReady]);

  const logFilter = useMemo<GameServerLogFilters>(() => {
    const severity = LOG_SEVERITY_FILTER_VALUES[severityOption];
    const search = debouncedSearch.length > 0 ? debouncedSearch : undefined;
    let dateRange: { min?: Date; max?: Date } | undefined = undefined;

    const now = new Date();
    switch (dateRangeSelection.preset) {
      case 'last1Hour':
        dateRange = {
          min: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago, UTC
        };
        break;
      case 'last1Day':
        dateRange = {
          min: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago, UTC
        };
        break;
      case 'last7Days':
        dateRange = {
          min: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago, UTC
        };
        break;
      case 'custom':
        if (dateRangeSelection.customStart || dateRangeSelection.customEnd) {
          dateRange = {
            min: dateRangeSelection.customStart,
            max: dateRangeSelection.customEnd,
          };
        }
        break;
      case 'all':
      default:
        // Leave undefined
        break;
    }

    return {
      severity,
      search,
      dateRange,
    };
  }, [severityOption, debouncedSearch, dateRangeSelection]);

  const handleSeverityChange = useCallback((value: string) => {
    const option = LOG_SEVERITY_FILTER_OPTIONS.find((o) => o === value);
    if (!option) {
      return;
    }
    setSeverityOption(option);
  }, []);

  const { data, fetchNextPage, hasNextPage, isLoading, isError } = useGameServerLogs({
    placeId,
    jobId,
    filter: logFilter,
  });

  const logs = useMemo(() => data?.pages.flatMap((page) => page.logs) ?? [], [data]);

  return (
    <div className='flex flex-col gap-xlarge'>
      <div className='flex flex-row justify-between items-start'>
        <div className='flex flex-row gap-medium max-width-fit'>
          <ServerLogsDateRangeControl
            label={translateWithNamespace(
              'CreatorDashboard.ServerManagement',
              'ServerDetailsPage.Logs.DateRangeLabel',
            )}
            options={DATE_RANGE_PRESET_OPTIONS}
            value={dateRangeSelection}
            onChange={setDateRangeSelection}
          />
          <Dropdown
            label={translateWithNamespace(
              'CreatorDashboard.ServerManagement',
              'ServerDetailsPage.Logs.SeverityLabel',
            )}
            size='Medium'
            placeholder={translateWithNamespace(
              'CreatorDashboard.ServerManagement',
              LOG_SEVERITY_FILTER_LABEL_KEYS.all,
            )}
            className='min-width-[220px]'
            value={severityOption}
            onValueChange={handleSeverityChange}>
            <Menu>
              {LOG_SEVERITY_FILTER_OPTIONS.map((option) => (
                <MenuItem
                  key={option}
                  value={option}
                  title={translateWithNamespace(
                    'CreatorDashboard.ServerManagement',
                    LOG_SEVERITY_FILTER_LABEL_KEYS[option],
                  )}
                />
              ))}
            </Menu>
          </Dropdown>
        </div>
        <div className='self-end grow max-width-[30%]'>
          <TextInput
            placeholder={translateWithNamespace(
              'CreatorDashboard.ServerManagement',
              'ServerDetailsPage.Logs.SearchLabel',
            )}
            value={rawSearch}
            className='width-full'
            id='search-logs'
            size='Medium'
            leadingIconName='icon-regular-magnifying-glass'
            onChange={(e) => setRawSearch(e.target.value)}
          />
        </div>
      </div>
      {isLoading && (
        <Typography>
          {translateWithNamespace(
            'CreatorDashboard.ServerManagement',
            'ServerDetailsPage.Logs.Loading',
          )}
        </Typography>
      )}
      {isError && (
        <Typography>
          {translateWithNamespace(
            'CreatorDashboard.ServerManagement',
            'ServerDetailsPage.Logs.Error',
          )}
        </Typography>
      )}
      {!isLoading && !isError && (
        <InfiniteScroll
          dataLength={logs.length}
          next={fetchNextPage}
          hasMore={hasNextPage}
          loader={
            <div className='flex justify-center padding-large'>
              <ProgressCircle
                variant='Indeterminate'
                size='Medium'
                ariaLabel={translateWithNamespace(
                  'CreatorDashboard.ServerManagement',
                  'ServerDetailsPage.Logs.Loading',
                )}
              />
            </div>
          }
          endMessage={
            <div className='text-align-x-center padding-large'>
              <Typography variant='body2'>
                {translateWithNamespace(
                  'CreatorDashboard.ServerManagement',
                  'ServerDetailsPage.Logs.NoMoreLogs',
                )}
              </Typography>
            </div>
          }
          height='calc(100vh)'>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  {translateWithNamespace(
                    'CreatorDashboard.ServerManagement',
                    'ServerDetailsPage.Logs.TimestampHeader',
                  )}
                </TableCell>
                <TableCell>
                  {translateWithNamespace(
                    'CreatorDashboard.ServerManagement',
                    'ServerDetailsPage.Logs.SeverityLabel',
                  )}
                </TableCell>
                <TableCell>
                  {translateWithNamespace(
                    'CreatorDashboard.ServerManagement',
                    'ServerDetailsPage.Logs.MessageHeader',
                  )}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <ServerLogRow log={log} key={log.id} />
              ))}
            </TableBody>
          </Table>
        </InfiniteScroll>
      )}
    </div>
  );
};

export default ServerLogsList;

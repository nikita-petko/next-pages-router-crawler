import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';
import { Badge, Icon, IconButton, ProgressCircle, Snackbar } from '@rbx/foundation-ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import {
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
  Menu,
  MenuItem,
  Card,
  TablePagination,
} from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { PAGINATION_CONSTANTS, POLLING_CONSTANTS } from '../../constants';
import useGameServers from '../../hooks/useGameServers';
import { seedServerSummary } from '../../hooks/useServerSummary';
import useUniversePlaces from '../../hooks/useUniversePlaces';
import type { GameServer } from '../../types/GameServer';
import type { GameServerFilters, GameServerRequestOptions } from '../../types/GameServerControls';
import formatUptime from '../../utils/formatUptime';
import { isRetriableGatewayError } from '../../utils/listGameServersWithRetry';
import { formatStartTime } from '../../utils/RestartActivityUtils';
import { joinGameInstance, shutdownGameInstance } from '../../utils/ServerActions';
import { getStatusDescriptionKey } from '../../utils/serverStatus';
import { syncTableStateToUrl, urlParamsToTableState } from '../../utils/urlServerFilterParams';
import useToast from '../../utils/useToast';
import ServerStatusIndicator from '../ServerStatusIndicator';
import styles from './ServerListTable.module.css';

const SORT_DIRECTION = {
  ASC: 'asc',
  DESC: 'desc',
} as const;
export type SortOrder = (typeof SORT_DIRECTION)[keyof typeof SORT_DIRECTION];

// width 1% + nowrap = shrink to header/cell content instead of soaking leftover table space
const COMPACT_COLUMN_CLASS = 'width-[1%] text-no-wrap';
const ENGINE_COLUMN_CLASS = 'min-width-[160px]';
const TIME_COLUMN_CLASS = 'min-width-[120px] width-[120px] text-no-wrap';
const STATUS_COLUMN_CLASS = 'min-width-[160px] padding-right-medium no-clip text-no-wrap';
const ACTIONS_COLUMN_CLASS = 'width-[1%] text-no-wrap padding-x-small';
const HEADER_DEFAULT_CLASS = 'text-label-medium padding-y-large padding-x-medium';
const LOADING_SHIMMER_ROWS = 6;
const OVERLAY_SHOW_DELAY_MS = 150;
const OVERLAY_FADE_MS = 150;

// api can repeat jobIds in one page; occurrence suffix keeps react keys unique
function nextServerRowKey(jobId: string, occurrenceByJobId: Map<string, number>): string {
  const occurrence = occurrenceByJobId.get(jobId) ?? 0;
  occurrenceByJobId.set(jobId, occurrence + 1);
  return occurrence === 0 ? jobId : `${jobId}#${occurrence}`;
}

type ServerColumnId =
  | 'status'
  | 'place_version'
  | 'engine_version'
  | 'occupancy'
  | 'frame_rate'
  | 'memory_usage_bytes'
  | 'create_time'
  | 'termination_time'
  | 'server_uptime'
  | 'server_type';

type ServerColumn = {
  id: ServerColumnId;
  translationKey: string;
  className: string;
  orderByField?: string;
  shutdownOnly?: boolean;
  sortable?: boolean;
};

const SERVER_COLUMNS: readonly ServerColumn[] = [
  {
    id: 'status',
    translationKey: 'ServerListTable.Column.Status',
    className: `${HEADER_DEFAULT_CLASS} ${STATUS_COLUMN_CLASS}`,
    shutdownOnly: true,
    sortable: false,
  },
  {
    id: 'place_version',
    translationKey: 'ServerListTable.Column.PlaceVersion',
    className: `${HEADER_DEFAULT_CLASS} ${COMPACT_COLUMN_CLASS}`,
  },
  {
    id: 'engine_version',
    translationKey: 'ServerListTable.Column.EngineVersion',
    className: `${HEADER_DEFAULT_CLASS} ${ENGINE_COLUMN_CLASS}`,
  },
  {
    id: 'occupancy',
    translationKey: 'ServerListTable.Column.Occupancy',
    className: `${HEADER_DEFAULT_CLASS} ${COMPACT_COLUMN_CLASS}`,
  },
  {
    id: 'frame_rate',
    translationKey: 'ServerListTable.Column.FrameRate',
    className: `${HEADER_DEFAULT_CLASS} ${COMPACT_COLUMN_CLASS}`,
  },
  {
    id: 'memory_usage_bytes',
    translationKey: 'ServerListTable.Column.MemoryUsed',
    className: `${HEADER_DEFAULT_CLASS} ${COMPACT_COLUMN_CLASS}`,
  },
  {
    id: 'create_time',
    translationKey: 'ServerListTable.Column.StartTime',
    className: `${HEADER_DEFAULT_CLASS} ${TIME_COLUMN_CLASS}`,
  },
  {
    id: 'termination_time',
    translationKey: 'ServerListTable.Column.ShutdownAt',
    className: `${HEADER_DEFAULT_CLASS} ${TIME_COLUMN_CLASS}`,
    shutdownOnly: true,
  },
  {
    id: 'server_uptime',
    translationKey: 'ServerListTable.Column.ServerUptime',
    className: `${HEADER_DEFAULT_CLASS} ${COMPACT_COLUMN_CLASS}`,
    orderByField: 'uptime',
  },
  {
    id: 'server_type',
    translationKey: 'ServerListTable.Column.ServerType',
    className: `${HEADER_DEFAULT_CLASS} ${COMPACT_COLUMN_CLASS}`,
  },
];

export interface ServerListTableProps {
  search?: string;
  filter?: GameServerFilters;
  placeId?: number | null;
  onTotalServersChange?: (newCount: number) => void;
  urlReady?: boolean;
  showShutdownServers?: boolean;
}

const ServerListTable: FunctionComponent<ServerListTableProps> = ({
  search,
  placeId,
  filter,
  onTotalServersChange,
  urlReady,
  showShutdownServers = false,
}) => {
  const { locale } = useLocalization();
  const { translate } = useTranslation();
  const { translate: translateKey } = useTranslationWrapper(useTranslation());
  const router = useRouter();
  const queryClient = useQueryClient();
  const tableRegionRef = useRef<HTMLDivElement>(null);
  const skipNextRootFetchRef = useRef(false);
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  });
  const showToast = useToast();
  const [copyToastOpen, setCopyToastOpen] = useState(false);
  const headings = useMemo(
    () => SERVER_COLUMNS.filter((column) => showShutdownServers || !column.shutdownOnly),
    [showShutdownServers],
  );

  const {
    fetchGameServers,
    refetchCurrentPage,
    fetchNextPage,
    fetchPreviousPage,
    error: gameServersError,
    isLoading: gameServersLoading,
    totalServers,
  } = useGameServers();
  const { isPlacesLoading } = useUniversePlaces();

  const [servers, setServers] = useState<GameServer[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>(SORT_DIRECTION.DESC);
  const [sortBy, setSortBy] = useState('create_time');
  const [selected, setSelected] = useState('');
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isPaginating, setIsPaginating] = useState(false);

  const [tableUrlReady, setTableUrlReady] = useState(false);
  const [menuServer, setMenuServer] = useState<GameServer | null>(null);
  const selectedIsShutdown = menuServer?.isShutdown ?? false;
  const selectedIsPublic = menuServer?.serverType === 'ServerType.Public';
  const numberLocale = locale ?? Locale.English;
  const numberFormatter = useMemo(() => new Intl.NumberFormat(numberLocale), [numberLocale]);

  if (!tableUrlReady && router.isReady) {
    const parsed = urlParamsToTableState(router.query);
    if (parsed.sortBy != null) {
      setSortBy(parsed.sortBy);
    }
    if (parsed.sortOrder != null) {
      setSortOrder(parsed.sortOrder);
    }
    if (parsed.rowsPerPage != null) {
      setRowsPerPage(parsed.rowsPerPage);
    }
    setTableUrlReady(true);
  }

  useEffect(() => {
    if (!tableUrlReady) {
      return;
    }
    syncTableStateToUrl(routerRef.current, { sortBy, sortOrder, rowsPerPage });
  }, [sortBy, sortOrder, rowsPerPage, tableUrlReady]);

  const [displayedTotalServers, setDisplayedTotalServers] = useState(0);
  const [hasSettledList, setHasSettledList] = useState(false);

  const isEmptyLoading =
    !placeId ||
    (isPlacesLoading && servers.length === 0) ||
    (gameServersLoading && servers.length === 0);
  if (!isEmptyLoading && placeId && !hasSettledList) {
    setHasSettledList(true);
  }
  // keep skeleton on gateway errors until silent retry recovers
  const keepLoadingOnGatewayError =
    servers.length === 0 && !!gameServersError && isRetriableGatewayError(gameServersError);
  const showEmptyLoading = (isEmptyLoading && !hasSettledList) || keepLoadingOnGatewayError;
  const isEmptyRefreshing =
    hasSettledList &&
    servers.length === 0 &&
    !keepLoadingOnGatewayError &&
    (gameServersLoading || isPaginating);
  const isTableUpdating =
    isEmptyRefreshing || (servers.length > 0 && (isPaginating || gameServersLoading));
  const [overlayMounted, setOverlayMounted] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  useEffect(() => {
    if (isTableUpdating) {
      const showTimer = window.setTimeout(() => {
        setOverlayMounted(true);
      }, OVERLAY_SHOW_DELAY_MS);
      return () => window.clearTimeout(showTimer);
    }
    // defer so the effect body never setStates synchronously
    const hideVisibleTimer = window.setTimeout(() => {
      setOverlayVisible(false);
    }, 0);
    const hideMountTimer = window.setTimeout(() => {
      setOverlayMounted(false);
    }, OVERLAY_FADE_MS);
    return () => {
      window.clearTimeout(hideVisibleTimer);
      window.clearTimeout(hideMountTimer);
    };
  }, [isTableUpdating]);
  useEffect(() => {
    if (!overlayMounted || !isTableUpdating) {
      return undefined;
    }
    const frame = window.requestAnimationFrame(() => setOverlayVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, [overlayMounted, isTableUpdating]);

  const fetchServers = useCallback(
    async (pageSize: number, silent = false): Promise<GameServer[] | null> => {
      if (!placeId || !urlReady || !tableUrlReady) {
        return null;
      }

      const activeSortHeading = headings.find((heading) => heading.id === sortBy);
      const requestSortField =
        activeSortHeading?.orderByField ?? activeSortHeading?.id ?? 'create_time';
      const orderRequest =
        requestSortField !== 'none'
          ? `${requestSortField}${sortOrder === SORT_DIRECTION.DESC ? ` ${sortOrder}` : ''}`
          : undefined;

      const version = filter?.placeVersion.length === 1 ? filter.placeVersion[0] : undefined;
      const finalFilter =
        filter?.placeVersion.length === 1 ? { ...filter, placeVersion: [] } : filter;

      const serverRequestOptions: GameServerRequestOptions = {
        orderBy: orderRequest,
        filter: finalFilter,
        search,
        pageSize,
        silent,
      };

      return fetchGameServers(placeId, version, serverRequestOptions);
    },
    [
      fetchGameServers,
      placeId,
      search,
      filter,
      sortBy,
      sortOrder,
      urlReady,
      tableUrlReady,
      headings,
    ],
  );

  const pageServers = useCallback(
    async (fetchFn: () => Promise<GameServer[] | null>) => {
      const serverResponse = await fetchFn();
      if (!serverResponse) {
        return false;
      }
      setServers(serverResponse);
      return true;
    },
    [setServers],
  );

  const refetchServers = useCallback(async () => {
    void pageServers(refetchCurrentPage);
  }, [pageServers, refetchCurrentPage]);

  const copyToClipboard = useCallback((jobId: string) => {
    void navigator.clipboard.writeText(jobId);
    setCopyToastOpen(true);
  }, []);

  const renderServerCell = useCallback(
    (server: GameServer, columnId: ServerColumnId) => {
      switch (columnId) {
        case 'status': {
          const statusLabel = translate(server.status);
          const statusDescriptionKey = getStatusDescriptionKey(server.status);
          return (
            <ServerStatusIndicator
              status={server.status}
              label={statusLabel}
              description={statusDescriptionKey ? translate(statusDescriptionKey) : statusLabel}
            />
          );
        }
        case 'place_version':
          return (
            <Badge
              label={translate('ServerListTable.Value.Version', { value: server.placeVersion })}
              variant='Neutral'
            />
          );
        case 'engine_version':
          return (
            <Badge
              label={translate('ServerListTable.Value.Version', { value: server.engineVersion })}
              variant='Neutral'
            />
          );
        case 'occupancy':
          return `${numberFormatter.format(server.occupancy.current)} / ${numberFormatter.format(
            server.occupancy.max,
          )}`;
        case 'frame_rate':
          return server.frameRate ? numberFormatter.format(Math.round(server.frameRate)) : '--';
        case 'memory_usage_bytes':
          return translate('ServerListTable.Value.DataSize', {
            count: numberFormatter.format(Math.trunc(server.memoryUsedMB)),
          });
        case 'create_time':
          return formatStartTime(server.createTime, translate);
        case 'termination_time':
          return server.terminateTime ? formatStartTime(server.terminateTime, translate) : '--';
        case 'server_uptime':
          return formatUptime(server.uptime, numberLocale);
        case 'server_type':
          return translate(server.serverType);
        default:
          return null;
      }
    },
    [numberFormatter, numberLocale, translate],
  );

  const handleRequestSort = useCallback(
    (property: string) => {
      const isAsc = sortBy === property && sortOrder === SORT_DIRECTION.ASC;
      setSortOrder(isAsc ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC);
      setSortBy(property);
    },
    [sortBy, sortOrder],
  );

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, server: GameServer) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelected(server.jobId);
    setMenuServer(server);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setSelected('');
  }, []);

  const handleViewDetails = useCallback(
    (server: GameServer) => {
      if (!router.query.id || !placeId) {
        return;
      }

      const idParam = router.query.id;
      const universeId = Array.isArray(idParam) ? idParam[0] : idParam;
      const detailsPath = `/dashboard/creations/experiences/${universeId}/server-management/${placeId}/servers/${server.jobId}/details`;
      seedServerSummary(
        queryClient,
        { universeId, placeId, jobId: server.jobId },
        {
          jobId: server.jobId,
          serverType: server.serverType,
          status: server.status,
          isShutdown: server.isShutdown,
        },
      );
      void router.push(server.isShutdown ? `${detailsPath}?shutdown=1` : detailsPath);
    },
    [placeId, queryClient, router],
  );

  const handleRestartServer = useCallback(
    async (jobId: string) => {
      if (!placeId) {
        return;
      }
      try {
        const response = await shutdownGameInstance(placeId, jobId);
        if (!response.ok) {
          showToast(translate('ServerDetailsPage.Snackbar.ErrorLaunchingRestart'));
        }
      } catch {
        showToast(translate('ServerDetailsPage.Snackbar.ErrorLaunchingRestart'));
      }
      handleMenuClose();
      void refetchServers();
    },
    [placeId, refetchServers, handleMenuClose, showToast, translate],
  );

  const scrollTableToTop = useCallback(() => {
    tableRegionRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, []);

  const handleChangePage = async (newPage: number) => {
    if (isPaginating || newPage === page) {
      return;
    }

    scrollTableToTop();
    setIsPaginating(true);
    try {
      let didLoadPage = false;
      if (newPage === 0) {
        didLoadPage = await pageServers(() => fetchServers(rowsPerPage));
      } else if (newPage < page) {
        didLoadPage = await pageServers(fetchPreviousPage);
      } else {
        didLoadPage = await pageServers(fetchNextPage);
      }

      if (didLoadPage) {
        setPage(newPage);
      }
    } finally {
      setIsPaginating(false);
    }
  };

  const handleRowsPerPageChange = async (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const nextRowsPerPage = parseInt(event.target.value, 10);
    scrollTableToTop();
    setIsPaginating(true);
    try {
      const response = await fetchServers(nextRowsPerPage);
      if (response) {
        skipNextRootFetchRef.current = true;
        setRowsPerPage(nextRowsPerPage);
        setPage(0);
        setServers(response);
      }
    } finally {
      setIsPaginating(false);
    }
  };

  useEffect(() => {
    if (skipNextRootFetchRef.current) {
      skipNextRootFetchRef.current = false;
      return undefined;
    }

    let cancelled = false;

    void fetchServers(rowsPerPage, false).then((response) => {
      if (cancelled) {
        return;
      }
      if (response == null) {
        return;
      }
      setServers(response);
      setPage(0);
    });

    return () => {
      cancelled = true;
    };
  }, [fetchServers, rowsPerPage]);

  // bool dep avoids re-arming retry loop on every failed silent poll
  const hasListError = gameServersError != null;
  useEffect(() => {
    if (!placeId || servers.length !== 0 || !hasListError) {
      return undefined;
    }
    const retryEmptyError = () => {
      void fetchServers(rowsPerPage, true).then((response) => {
        if (response) {
          setServers(response);
          setPage(0);
        }
      });
    };
    retryEmptyError();
    const interval = setInterval(retryEmptyError, POLLING_CONSTANTS.INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchServers, placeId, servers.length, hasListError, rowsPerPage]);

  const holdDisplayedTotal = totalServers === 0 && servers.length > 0 && gameServersLoading;
  if (!holdDisplayedTotal && displayedTotalServers !== totalServers) {
    setDisplayedTotalServers(totalServers);
  }

  useEffect(() => {
    if (holdDisplayedTotal) {
      return;
    }
    onTotalServersChange?.(totalServers);
  }, [holdDisplayedTotal, onTotalServersChange, totalServers]);

  const serverRows = useMemo(() => {
    const occurrenceByJobId = new Map<string, number>();
    return servers.map((server) => ({
      server,
      rowKey: nextServerRowKey(server.jobId, occurrenceByJobId),
    }));
  }, [servers]);

  const loadingLabel = translate('ServerListTable.Loading');
  const shimmerRows = (
    <>
      {Array.from({ length: LOADING_SHIMMER_ROWS }, (_, index) => (
        <TableRow key={`shimmer-${index}`}>
          {headings.map((heading) => (
            <TableCell className={heading.className} key={heading.id}>
              <Skeleton animate variant='rectangular' height={20} width='80%' />
            </TableCell>
          ))}
          <TableCell className={ACTIONS_COLUMN_CLASS} />
        </TableRow>
      ))}
    </>
  );

  if (showEmptyLoading) {
    return (
      <Card variant='outlined'>
        <div className={styles.tableScroller}>
          <Table className={`min-width-900 width-full ${styles.table}`} aria-busy='true'>
            <TableHead>
              <TableRow>
                {headings.map((heading) => (
                  <TableCell className={heading.className} key={heading.id}>
                    {translate(heading.translationKey)}
                  </TableCell>
                ))}
                <TableCell className={ACTIONS_COLUMN_CLASS} />
              </TableRow>
            </TableHead>
            <TableBody>{shimmerRows}</TableBody>
          </Table>
        </div>
      </Card>
    );
  }

  if (gameServersError && servers.length === 0) {
    return (
      <div>
        <Typography variant='body1' color='secondary'>
          {translate('ServerListTable.Error.Generic')}
        </Typography>
      </div>
    );
  }

  return (
    <div ref={tableRegionRef}>
      <div className='relative'>
        {overlayMounted && (
          <output
            className={`${styles.loadingOverlay}${overlayVisible ? ` ${styles.loadingOverlayVisible}` : ''}`}
            aria-live='polite'
            aria-atomic='true'
            aria-hidden={!overlayVisible}>
            <div className={`absolute ${styles.loadingShimmer}`} aria-hidden='true' />
            <div className={styles.loadingOverlayContent}>
              <ProgressCircle variant='Indeterminate' size='Medium' ariaLabel={loadingLabel} />
              <span className='text-body-small content-emphasis'>{loadingLabel}</span>
            </div>
          </output>
        )}
        <div aria-busy={isTableUpdating} inert={isTableUpdating ? true : undefined}>
          <Card variant='outlined'>
            <div className={styles.tableScroller}>
              <Table className={`min-width-900 width-full ${styles.table}`}>
                <TableHead>
                  <TableRow>
                    {headings.map((heading) => (
                      <TableCell className={heading.className} key={heading.id}>
                        {heading.sortable === false ? (
                          translate(heading.translationKey)
                        ) : (
                          <TableSortLabel
                            active={sortBy === heading.id}
                            direction={sortBy === heading.id ? sortOrder : SORT_DIRECTION.ASC}
                            onClick={() => handleRequestSort(heading.id)}>
                            {translate(heading.translationKey)}
                          </TableSortLabel>
                        )}
                      </TableCell>
                    ))}
                    <TableCell className={ACTIONS_COLUMN_CLASS} />
                  </TableRow>
                </TableHead>
                {/* remount on page change so duplicate-key orphans from a prior page can't linger */}
                <TableBody key={page}>
                  {servers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={headings.length + 1}>
                        <Typography variant='body1' color='secondary'>
                          {translate('ServerListTable.Empty')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    serverRows.map(({ server, rowKey }) => (
                      <TableRow
                        key={rowKey}
                        hover
                        className='cursor-pointer'
                        onClick={() => handleViewDetails(server)}>
                        {headings.map((heading) => (
                          <TableCell className={heading.className} key={heading.id}>
                            {renderServerCell(server, heading.id)}
                          </TableCell>
                        ))}
                        <TableCell className={ACTIONS_COLUMN_CLASS} align='right'>
                          <IconButton
                            ariaLabel={translate('ServerDetailsPage.PlayerActionsMenu')}
                            variant='Utility'
                            size='Small'
                            icon='icon-regular-three-dots-vertical'
                            onClick={(e: React.MouseEvent<HTMLElement>) =>
                              handleMenuOpen(e, server)
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
      <div className='flex justify-end items-center'>
        <TablePagination
          component='div'
          page={page}
          rowsPerPageOptions={PAGINATION_CONSTANTS.ROWS_PER_PAGE_OPTIONS}
          count={displayedTotalServers}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => handleChangePage(newPage)}
          onRowsPerPageChange={handleRowsPerPageChange}
          disabled={isTableUpdating}
          labelDisplayedRows={({ from, to, count }) =>
            translateKey(translationKey('Label.PageRange', TranslationNamespace.Table), {
              pageRange: `${numberFormatter.format(from)}-${numberFormatter.format(to)}`,
              totalPageCount: numberFormatter.format(count),
            })
          }
        />
      </div>
      <Menu
        anchorEl={anchorEl}
        open={selected.length > 0}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}>
        <MenuItem
          className='min-width-150'
          onClick={() => {
            if (menuServer) {
              handleViewDetails(menuServer);
            }
            handleMenuClose();
          }}>
          {translate('ServerListTable.Actions.ViewDetails')}
        </MenuItem>
        <MenuItem
          className='min-width-150'
          onClick={() => {
            if (menuServer) {
              copyToClipboard(menuServer.jobId);
            }
            handleMenuClose();
          }}>
          {translate('ServerListTable.Actions.CopyJobId')}
        </MenuItem>
        {!selectedIsShutdown && [
          <MenuItem
            key='join-server'
            className='min-width-150'
            disabled={!selectedIsPublic}
            onClick={() => {
              if (placeId) {
                joinGameInstance(selected, placeId);
              }
              handleMenuClose();
            }}>
            <span className='flex items-center width-full gap-small'>
              <Typography className='grow'>
                {translate('ServerListTable.Actions.JoinServer')}
              </Typography>
              <Icon name='icon-filled-arrow-up-right-from-square' />
            </span>
          </MenuItem>,
          <MenuItem
            key='restart-server'
            className='min-width-150'
            onClick={() => {
              void handleRestartServer(selected);
              handleMenuClose();
            }}>
            {translate('ServerListTable.Actions.RestartServer')}
          </MenuItem>,
        ]}
      </Menu>
      {copyToastOpen && (
        <Snackbar
          title={translate('ServerListTable.JobIdCopySuccess')}
          icon='icon-regular-circle-check'
          onClose={() => setCopyToastOpen(false)}
          shouldAutoDismiss
        />
      )}
    </div>
  );
};

export default ServerListTable;

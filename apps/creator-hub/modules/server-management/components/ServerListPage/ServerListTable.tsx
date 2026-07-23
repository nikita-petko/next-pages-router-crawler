import React, { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
  useSnackbar,
  Menu,
  MenuItem,
  Card,
  TablePagination,
  Tooltip,
} from '@rbx/ui';
import { Badge, Icon, IconButton } from '@rbx/foundation-ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { useRouter } from 'next/router';
import styles from './ServerListTable.module.css';
import { GameServer } from '../../types/GameServer';
import { GameServerFilters, GameServerRequestOptions } from '../../types/GameServerControls';
import useGameServers from '../../hooks/useGameServers';
import { PAGINATION_CONSTANTS, POLLING_CONSTANTS } from '../../constants';
import useUniversePlaces from '../../hooks/useUniversePlaces';
import { joinGameInstance, shutdownGameInstance } from '../../utils/ServerActions';
import useToast from '../../utils/useToast';
import { syncTableStateToUrl, urlParamsToTableState } from '../../utils/urlParams';
import { formatStartTime } from '../../utils/RestartActivityUtils';

const SORT_DIRECTION = {
  ASC: 'asc',
  DESC: 'desc',
} as const;
export type SortOrder = (typeof SORT_DIRECTION)[keyof typeof SORT_DIRECTION];

const STICKY_CELL_CLASS = `min-width-250 ${styles.stickyCell} text-no-wrap bg-surface-0`;
const DATA_COLUMN_CLASS = 'min-width-[150px]';
const HEADER_DEFAULT_CLASS = 'text-label-medium padding-y-large padding-x-medium';

export interface ServerListTableProps {
  search?: string;
  filter?: GameServerFilters;
  placeId?: number | null;
  onTotalServersChange?: (newCount: number) => void;
  urlReady?: boolean;
}

const ServerListTable: FunctionComponent<ServerListTableProps> = ({
  search,
  placeId,
  filter,
  onTotalServersChange,
  urlReady,
}) => {
  const { locale } = useLocalization();
  const { translate } = useTranslation();
  const { enqueue, close: closeSnackbar } = useSnackbar();
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const showToast = useToast();

  const headings = [
    {
      id: 'job_id',
      translationKey: 'ServerListTable.Column.JobId',
      className: `${HEADER_DEFAULT_CLASS} ${STICKY_CELL_CLASS}`,
    },
    {
      id: 'place_version',
      translationKey: 'ServerListTable.Column.PlaceVersion',
      className: `${HEADER_DEFAULT_CLASS} ${DATA_COLUMN_CLASS}`,
    },
    {
      id: 'engine_version',
      translationKey: 'ServerListTable.Column.EngineVersion',
      className: `${HEADER_DEFAULT_CLASS} ${DATA_COLUMN_CLASS}`,
    },
    {
      id: 'occupancy',
      translationKey: 'ServerListTable.Column.Occupancy',
      className: `${HEADER_DEFAULT_CLASS} ${DATA_COLUMN_CLASS}`,
    },
    {
      id: 'frame_rate',
      translationKey: 'ServerListTable.Column.FrameRate',
      className: `${HEADER_DEFAULT_CLASS} ${DATA_COLUMN_CLASS}`,
    },
    {
      id: 'memory_usage_bytes',
      translationKey: 'ServerListTable.Column.MemoryUsed',
      className: `${HEADER_DEFAULT_CLASS} ${DATA_COLUMN_CLASS}`,
    },
    {
      id: 'create_time',
      translationKey: 'ServerListTable.Column.StartTime',
      className: `${HEADER_DEFAULT_CLASS} ${DATA_COLUMN_CLASS}`,
    },
  ];

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
  const [sortOrder, setSortOrder] = useState<SortOrder>(SORT_DIRECTION.ASC);
  const [sortBy, setSortBy] = useState('create_time');
  const [selected, setSelected] = useState('');
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [tableUrlReady, setTableUrlReady] = useState(false);

  useEffect(() => {
    if (tableUrlReady || !router.isReady) return;
    const parsed = urlParamsToTableState(router.query);
    if (parsed.sortBy != null) setSortBy(parsed.sortBy);
    if (parsed.sortOrder != null) setSortOrder(parsed.sortOrder);
    if (parsed.rowsPerPage != null) setRowsPerPage(parsed.rowsPerPage);
    setTableUrlReady(true);
  }, [tableUrlReady, router.isReady, router.query]);

  useEffect(() => {
    if (!tableUrlReady) return;
    syncTableStateToUrl(routerRef.current, { sortBy, sortOrder, rowsPerPage });
  }, [sortBy, sortOrder, rowsPerPage, tableUrlReady]);

  const fetchServers = useCallback(async () => {
    if (!placeId || !urlReady || !tableUrlReady) return;

    const orderRequest =
      sortBy !== 'none'
        ? `${sortBy}${sortOrder === SORT_DIRECTION.DESC ? ` ${sortOrder}` : ''}`
        : undefined;
    // If there's only one version, we can put it in the url and remove it from the filter, otherwise just use the filter
    const version = filter?.placeVersion.length === 1 ? filter.placeVersion[0] : undefined;
    const finalFilter =
      filter?.placeVersion.length === 1 ? { ...filter, placeVersion: [] } : filter;

    const serverRequestOptions: GameServerRequestOptions = {
      orderBy: orderRequest,
      filter: finalFilter,
      search,
      pageSize: rowsPerPage,
    };

    const serversResponse = await fetchGameServers(placeId, version, serverRequestOptions);
    if (!serversResponse) {
      return;
    }

    setServers(serversResponse);
  }, [
    fetchGameServers,
    setServers,
    placeId,
    search,
    filter,
    sortBy,
    sortOrder,
    rowsPerPage,
    urlReady,
    tableUrlReady,
  ]);

  const pageServers = async (fetchFn: () => Promise<GameServer[] | null>) => {
    const serverResponse = await fetchFn();
    if (!serverResponse) {
      return;
    }
    setServers(serverResponse);
  };

  const refetchServers = useCallback(async () => {
    pageServers(refetchCurrentPage);
  }, [refetchCurrentPage]);

  const showSnackbar = useCallback(
    (msg: string) => {
      enqueue({
        children: <Alert severity='success'>{msg}</Alert>,
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
        autoHide: true,
        onClose: closeSnackbar,
      });
    },
    [enqueue, closeSnackbar],
  );

  const copyToClipboard = useCallback(
    (jobId: string) => {
      navigator.clipboard.writeText(jobId);
      showSnackbar(translate('ServerListTable.JobIdCopySuccess'));
    },
    [showSnackbar, translate],
  );

  const handleRequestSort = useCallback(
    (property: string) => {
      const isAsc = sortBy === property && sortOrder === SORT_DIRECTION.ASC;
      setSortOrder(isAsc ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC);
      setSortBy(property);
    },
    [sortBy, sortOrder],
  );

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, jobId: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelected(jobId);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setSelected('');
  }, []);

  const handleViewDetails = useCallback(
    (jobId: string) => {
      if (!router.query.id || !placeId) return;

      const universeId = router.query.id as string;
      router.push(
        `/dashboard/creations/experiences/${universeId}/server-management/${placeId}/servers/${jobId}/details`,
      );
    },
    [router, placeId],
  );

  const handleRestartServer = useCallback(
    async (jobId: string) => {
      if (!placeId) return;
      try {
        const response = await shutdownGameInstance(placeId, jobId);
        if (!response.ok) {
          showToast(translate('ServerDetailsPage.Snackbar.ErrorLaunchingRestart'));
        }
      } catch {
        showToast(translate('ServerDetailsPage.Snackbar.ErrorLaunchingRestart'));
      }
      handleMenuClose();
      refetchServers();
    },
    [placeId, refetchServers, handleMenuClose, showToast, translate],
  );

  const handleChangePage = useCallback(
    async (newPage: number) => {
      if (newPage === 0) {
        // If returning to the first page, just refetch since we may have gotten out of sync
        await fetchServers();
      } else if (newPage < page) {
        pageServers(fetchPreviousPage);
      } else if (newPage > page) {
        pageServers(fetchNextPage);
      }
      setPage(newPage);
    },
    [page, fetchServers, fetchPreviousPage, fetchNextPage],
  );

  useEffect(() => {
    fetchServers();
    // When fetching the first page like this, reset to 0
    setPage(0);
  }, [fetchServers]);

  // Only poll when there is an error or 0 servers - that way errors can get resolved if only present for one poll
  useEffect(() => {
    if (placeId && (gameServersError || servers.length === 0)) {
      const interval = setInterval(() => {
        refetchServers();
      }, POLLING_CONSTANTS.INTERVAL_MS);

      return () => clearInterval(interval);
    }
    return undefined;
  }, [refetchServers, placeId, page, gameServersError, servers.length]);

  useEffect(() => {
    if (onTotalServersChange) {
      onTotalServersChange(totalServers);
    }
  }, [onTotalServersChange, totalServers]);

  if (!placeId || isPlacesLoading) {
    return (
      <div>
        <Typography variant='body1' color='secondary'>
          {translate('ServerListTable.Loading')}
        </Typography>
      </div>
    );
  }

  if (gameServersError) {
    return (
      <div>
        <Typography variant='body1' color='secondary'>
          {translate('ServerListTable.Error', { error: gameServersError.message })}
        </Typography>
      </div>
    );
  }

  return (
    <div>
      <Card variant='outlined'>
        <div style={{ overflowX: 'auto' }}>
          <Table className={`min-width-900 width-full ${styles.table}`}>
            <TableHead>
              <TableRow>
                {headings.map((heading) => (
                  <TableCell className={`${heading.className}`} key={heading.id}>
                    <TableSortLabel
                      active={sortBy === heading.id}
                      direction={sortBy === heading.id ? sortOrder : SORT_DIRECTION.ASC}
                      onClick={() => handleRequestSort(heading.id)}>
                      {translate(heading.translationKey)}
                    </TableSortLabel>
                  </TableCell>
                ))}
                <TableCell className={`${HEADER_DEFAULT_CLASS} ${DATA_COLUMN_CLASS}`}>
                  {translate('ServerListTable.Column.ServerType')}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {servers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Typography variant='body1' color='secondary'>
                      {translate('ServerListTable.Empty')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                servers.map((server) => (
                  <TableRow
                    key={server.jobId}
                    hover
                    className='cursor-pointer'
                    onClick={() => handleViewDetails(server.jobId)}>
                    <TableCell className={STICKY_CELL_CLASS}>
                      <span className='flex items-center gap-xsmall'>
                        <span
                          className='text-truncate-end text-no-wrap min-width-0'
                          style={{ fontFamily: 'Builder Mono' }}>
                          {server.jobId}
                        </span>
                        <IconButton
                          size='Small'
                          variant='Utility'
                          as='a'
                          icon='icon-regular-two-stacked-squares'
                          ariaLabel='Copy'
                          style={{ marginLeft: 2, flexShrink: 0 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(server.jobId);
                          }}
                        />
                      </span>
                    </TableCell>
                    <TableCell className={DATA_COLUMN_CLASS}>
                      <Badge label={`v${server.placeVersion}`} color='secondary' />
                    </TableCell>
                    <TableCell className={DATA_COLUMN_CLASS}>
                      <Badge label={`v${server.engineVersion}`} color='secondary' />
                    </TableCell>
                    <TableCell className={DATA_COLUMN_CLASS}>
                      {`${server.occupancy.current} / ${server.occupancy.max}`}
                    </TableCell>
                    <TableCell className={DATA_COLUMN_CLASS}>
                      {server.frameRate ? server.frameRate.toFixed(0) : '--'}
                    </TableCell>
                    <TableCell className={DATA_COLUMN_CLASS}>
                      {`${Intl.NumberFormat(locale ?? Locale.English, {}).format(Math.trunc(server.memoryUsedMB))} MB`}
                    </TableCell>
                    <TableCell className={DATA_COLUMN_CLASS}>
                      <Tooltip
                        title={
                          <div className='flex flex-col text-align-x-center'>
                            <span className='text-caption-medium'>
                              {translate('ServerListTable.Tooltip.Uptime')}
                            </span>
                            <span className='text-body-small'>{server.uptime}</span>
                          </div>
                        }
                        placement='bottom'
                        arrow>
                        <span>{formatStartTime(server.createTime, translate)}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell className={DATA_COLUMN_CLASS}>
                      {translate(server.serverType)}
                    </TableCell>
                    <TableCell align='right'>
                      <IconButton
                        ariaLabel='view-actions'
                        variant='Utility'
                        size='Small'
                        icon='icon-regular-three-dots-vertical'
                        onClick={(e) => handleMenuOpen(e, server.jobId)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      <div className='flex justify-end items-center'>
        <TablePagination
          component='div'
          page={page}
          rowsPerPageOptions={PAGINATION_CONSTANTS.ROWS_PER_PAGE_OPTIONS}
          count={totalServers}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => handleChangePage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          disabled={gameServersLoading}
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
          disabled={
            servers.find((server) => server.jobId === selected)?.serverType !== 'ServerType.Public'
          }
          onClick={() => joinGameInstance(selected, placeId)}>
          <span className='flex items-center width-full gap-small'>
            <Typography className='grow'>
              {translate('ServerListTable.Actions.JoinServer')}
            </Typography>
            <Icon name='icon-filled-arrow-up-right-from-square' />
          </span>
        </MenuItem>
        <MenuItem
          className='min-width-150'
          onClick={() => {
            handleRestartServer(selected);
            handleMenuClose();
          }}>
          {translate('ServerListTable.Actions.RestartServer')}
        </MenuItem>
      </Menu>
    </div>
  );
};

export default ServerListTable;

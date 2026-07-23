import React, { FunctionComponent, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  Grid,
  TextField,
  InputAdornment,
  SearchIcon,
  CancelIcon,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  CircularProgress,
  MoreVertIcon,
  RefreshIcon,
  DeleteOutlinedIcon,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  useDialog,
} from '@rbx/ui';
import { Key } from '@rbx/core';
import { Locale, withTranslation, useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useListDataStoresViewStyles from './ListDataStoresView.styles';
import { MAX_PAGE_SIZE, formatBytes, formatNumberToKMB, formatDate } from '../../common';
import { getDataStoreStorage } from '../../openCloudStandardDataStoresRequests';
import type { DataStore } from '../../types';
import { DataStoreState } from '../../types';
import useToast from '../../utils/useToast';
import DataStoresDeletionDialog from '../DataStoresDeletionDialog/DataStoresDeletionDialog';

interface DataStoresListProps {
  universeId: number;
  dataStores: DataStore[];
  useStorage: boolean;
  cursor?: string;
  userHasDeletePermission: boolean;
  locale: Locale;
  loadEntryList: (dataStoreName: string) => void;
  resetView: () => void;
}

const ListDataStoresView: FunctionComponent<DataStoresListProps> = ({
  universeId,
  dataStores,
  useStorage,
  cursor,
  userHasDeletePermission,
  locale,
  loadEntryList,
  resetView,
}) => {
  const {
    classes: {
      searchInputAdornment,
      cancelInputAdornment,
      listManagerContainer,
      dsCard,
      actionMenuCell,
      tableCellContainer,
      dataStoreNameCell,
      listDataStoresTable,
      dataStoresListRow,
      dataStoresListRowDeleted,
      dataStoresListCell,
      dataStoresListCellDeleted,
      listIcon,
    },
  } = useListDataStoresViewStyles();

  // State management variables
  const { translate } = useTranslation();
  const [showDeleted, setShowDeleted] = useState<boolean>(false);
  const [dataStoreToAction, setDataStoreToAction] = useState<string | null>(null);
  const [selectedDataStore, setSelectedDataStore] = useState<string>('');
  const [listData, setListData] = useState<DataStore[]>(dataStores);
  const [loadList, setLoadList] = useState<boolean>(false);
  // Pagination variables
  const [dataStoresPage, setDataStoresPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(MAX_PAGE_SIZE);
  const [dataStoresPagination, setDataStoresPagination] = useState<Map<number, string | undefined>>( // This is a map of the pageNumber and cursor
    new Map<number, string | undefined>(),
  );

  // Prefix search variables
  const [currentPrefix, setCurrentPrefix] = useState<string>('');
  const [isSearchingDataStores, setIsSearchingDataStores] = useState(false);
  const [dataStoresSearchBoxValue, setDataStoresSearchBoxValue] = useState<string>('');

  // Component handling variables
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { open, close, configure } = useDialog();
  const showToast = useToast();

  const setupPagination = useCallback(async (listDataStores: DataStore[], startCursor?: string) => {
    const newMap = new Map<number, string | undefined>();
    newMap.set(0, undefined); // Page 0 is always the start (no cursor)
    setListData(listDataStores);
    if (startCursor && startCursor !== '') {
      newMap.set(1, startCursor); // If we have a cursor, set it for page 1
    }

    setDataStoresPagination(newMap);
  }, []);

  // Occurs once during page load to initialize pagination map
  useEffect(() => {
    setupPagination(dataStores, cursor);
  }, [setupPagination, cursor, dataStores]);

  const resetListDataStoresState = useCallback(
    async (
      prefix: string,
      showDeletedParam: boolean,
      pageNumber: number,
      resetPagination: boolean,
      pageToken?: string,
      numItems?: number,
    ) => {
      const effectiveShowDeleted = showDeletedParam === undefined ? showDeleted : showDeletedParam;
      setCurrentPrefix(prefix);
      const response = await getDataStoreStorage(
        universeId,
        useStorage,
        numItems ?? rowsPerPage,
        pageToken,
        prefix,
        effectiveShowDeleted,
      );

      setListData(response.dataStores);
      setDataStoresPage(pageNumber);

      // If we need to reset pagination, start new
      if (resetPagination) {
        setupPagination(response.dataStores, response.cursor ?? undefined);
      }
    },
    [rowsPerPage, setupPagination, showDeleted, universeId, useStorage],
  );

  // Handle pagination (fetch the next page of data stores)
  const handleDataStoresPageChange = async (page: number) => {
    try {
      const pageToken = dataStoresPagination.get(page);
      const response = await getDataStoreStorage(
        universeId,
        useStorage,
        rowsPerPage,
        pageToken,
        currentPrefix,
        showDeleted,
      );

      setListData(response.dataStores);

      // Update pagination map with the new cursor for the next page
      const newPagination = new Map(dataStoresPagination);
      if (!newPagination.has(page + 1)) {
        newPagination.set(page + 1, response.cursor ?? undefined);
        setDataStoresPagination(newPagination);
      }

      setDataStoresPage(page);
    } catch {
      setListData([]);
    } finally {
      setLoadList(false);
    }
  };

  // Handle opening the kebab menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, dataStoreName: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setDataStoreToAction(dataStoreName);
  };

  // Handle changes in the search box value
  const searchBoxValueChanged = useCallback((event: React.ChangeEvent) => {
    const { value } = event.target as HTMLInputElement;
    setDataStoresSearchBoxValue(value);
  }, []);

  // Handle pressing "Enter" to trigger search
  const searchBoxKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === Key.Enter) {
        resetListDataStoresState(
          (event.target as HTMLInputElement).value,
          showDeleted,
          0,
          true,
          undefined,
          rowsPerPage,
        );
      }
    },
    [resetListDataStoresState, showDeleted, rowsPerPage],
  );

  const showSuccessMessage = useCallback(
    (success: boolean) => {
      if (success) {
        showToast('Operation successful', false);
        resetListDataStoresState(
          currentPrefix,
          showDeleted,
          dataStoresPage,
          false,
          dataStoresPagination.get(dataStoresPage),
          rowsPerPage,
        );
      } else {
        showToast('Operation failed', true);
      }

      resetView();
      setAnchorEl(null);
      close();
    },
    [
      resetView,
      close,
      showToast,
      resetListDataStoresState,
      currentPrefix,
      showDeleted,
      dataStoresPage,
      dataStoresPagination,
      rowsPerPage,
    ],
  );

  // Update searching status based on the search box value
  useEffect(() => {
    setIsSearchingDataStores(dataStoresSearchBoxValue.trim() !== '');
  }, [dataStoresSearchBoxValue]);

  // Reset search when canceling, and fetch the original (unfiltered) data
  const handleSearchCancel = () => {
    setDataStoresSearchBoxValue('');

    // If our current prefix is not empty, we need to reset the view
    if (currentPrefix && currentPrefix !== '') {
      resetListDataStoresState('', showDeleted, 0, true, '');
    }

    setCurrentPrefix('');
  };

  const handleToggleShowDeleted = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;
    setShowDeleted(isChecked);

    // Reset pagination to the first page
    try {
      await resetListDataStoresState(currentPrefix, isChecked, 0, true, '');
    } catch {
      setListData([]);
    } finally {
      setLoadList(false);
    }
  };

  const openDataStoresDialog = useCallback(
    (dataStoreName: string, deletion: boolean) => (
      <DataStoresDeletionDialog
        universeId={universeId}
        dataStore={dataStoreName ?? ''}
        deletion={deletion}
        closeDialog={() => {
          close();
          setAnchorEl(null);
        }}
        showSuccessToast={showSuccessMessage}
      />
    ),
    [universeId, close, showSuccessMessage],
  );

  const menuOptions = useMemo(() => {
    return (
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}>
        {listData.find((ds) => ds.name === dataStoreToAction)?.state === DataStoreState.DELETED ? (
          <MenuItem
            onClick={() => {
              configure(openDataStoresDialog(dataStoreToAction ?? '', false));
              open();
            }}
            data-testid={`${dataStoreToAction}-undelete-menu-item`}>
            <ListItemIcon className={listIcon}>
              <RefreshIcon />
            </ListItemIcon>
            <Typography>{translate('Label.Restore')}</Typography>
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => {
              configure(openDataStoresDialog(dataStoreToAction ?? '', true));
              open();
            }}
            data-testid={`${dataStoreToAction}-delete-menu-item`}>
            <ListItemIcon className={listIcon}>
              <DeleteOutlinedIcon />
            </ListItemIcon>
            <Typography>{translate('Label.MarkForDeletion')}</Typography>
          </MenuItem>
        )}
      </Menu>
    );
  }, [
    anchorEl,
    configure,
    dataStoreToAction,
    listData,
    open,
    openDataStoresDialog,
    translate,
    listIcon,
  ]);

  let content;

  if (loadList) {
    content = (
      <Grid container justifyContent='center' alignItems='center'>
        <CircularProgress color='secondary' />
      </Grid>
    );
  }
  // Entries available
  else {
    content = (
      <TableContainer className={listDataStoresTable}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className={dataStoreNameCell} align='left'>
                {translate('Label.DataStoreName')}
              </TableCell>
              <TableCell className={tableCellContainer} align='right'>
                {translate('Label.NumKeys')}
              </TableCell>
              <TableCell className={tableCellContainer} align='right'>
                {translate('Label.DataStoreSize')}
              </TableCell>
              {userHasDeletePermission && (
                <TableCell className={tableCellContainer} align='right'>
                  {translate('Label.Action')}
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {listData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={userHasDeletePermission ? 4 : 3}
                  align='center'
                  style={{
                    textAlign: 'center',
                    padding: '40px 16px',
                    borderBottom: 'none',
                  }}>
                  <Typography color='secondary' variant='body1'>
                    {translate('Description.NoDataStoreFound')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              listData.map((dataStore) => (
                <TableRow
                  key={dataStore.name}
                  hover={dataStore.state !== DataStoreState.DELETED}
                  selected={
                    dataStore.name === selectedDataStore &&
                    dataStore.state !== DataStoreState.DELETED
                  }
                  className={
                    dataStore.state === DataStoreState.DELETED
                      ? dataStoresListRowDeleted
                      : dataStoresListRow
                  }
                  onClick={() => {
                    if (loadEntryList && dataStore.state !== DataStoreState.DELETED) {
                      loadEntryList(dataStore.name);
                      setSelectedDataStore(dataStore.name);
                    }
                  }}>
                  <TableCell
                    align='left'
                    className={
                      dataStore.state === DataStoreState.DELETED
                        ? dataStoresListCellDeleted
                        : dataStoresListCell
                    }>
                    <Typography variant='caption' component='p'>
                      {dataStore.name}
                      {dataStore.state === DataStoreState.DELETED &&
                        `\n⚠️Permanent deletion begins after ${formatDate(dataStore.expireTime!, locale)}`}
                    </Typography>
                  </TableCell>
                  <TableCell
                    data-testid={`${dataStore.name}-num-keys`}
                    align='right'
                    className={
                      dataStore.state === DataStoreState.DELETED
                        ? dataStoresListCellDeleted
                        : dataStoresListCell
                    }>
                    <Typography variant='body2'>{formatNumberToKMB(dataStore.numKeys)}</Typography>
                  </TableCell>
                  <TableCell
                    data-testid={`${dataStore.name}-total-size`}
                    align='right'
                    className={
                      dataStore.state === DataStoreState.DELETED
                        ? dataStoresListCellDeleted
                        : dataStoresListCell
                    }>
                    <Typography variant='body2'>{formatBytes(dataStore.totalSizeBytes)}</Typography>
                  </TableCell>
                  {userHasDeletePermission && (
                    <TableCell className={actionMenuCell} align='right'>
                      <IconButton
                        onClick={(event) => handleMenuOpen(event, dataStore.name ?? '')}
                        data-testid={`${dataStore.name}-action-menu`}
                        size='small'
                        color='secondary'
                        aria-label={`Action for ${dataStore.name}`}>
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter>
            <TableRow data-testid='pagination-row'>
              <TablePagination
                count={-1} // Use -1 for cursor-based pagination to show next/prev buttons only
                page={dataStoresPage}
                rowsPerPageOptions={[10, 15, 25]}
                rowsPerPage={rowsPerPage}
                onPageChange={(e, newPageNumber) => {
                  // Only allow navigation if we have a cursor for the target page or going backwards
                  const targetPageCursor = dataStoresPagination.get(newPageNumber);
                  if (newPageNumber < dataStoresPage || targetPageCursor !== undefined) {
                    handleDataStoresPageChange(newPageNumber);
                  }
                }}
                onRowsPerPageChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  const numItems = parseInt(event.target.value, 10);
                  resetListDataStoresState(
                    currentPrefix,
                    showDeleted,
                    0,
                    true,
                    undefined,
                    numItems,
                  );
                  setRowsPerPage(numItems);
                }}
                labelRowsPerPage='Rows per page:'
                labelDisplayedRows={() =>
                  `${dataStoresPage * rowsPerPage + 1} - ${(dataStoresPage + 1) * rowsPerPage + 1}`
                }
                slotProps={{
                  actions: {
                    nextButton: {
                      disabled:
                        !dataStoresPagination.has(dataStoresPage + 1) ||
                        dataStoresPagination.get(dataStoresPage + 1) === undefined,
                    },
                    previousButton: {
                      disabled: dataStoresPage === 0,
                    },
                  },
                }}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    );
  }

  return (
    <Grid container XSmall={12}>
      <Grid container item XSmall={12} alignItems='center' className={listManagerContainer}>
        <Grid item XSmall={10}>
          <TextField
            fullWidth
            size='small'
            onChange={(event) => searchBoxValueChanged(event)}
            onKeyDown={(event) => searchBoxKeyDown(event)}
            InputProps={{
              startAdornment: (
                <InputAdornment className={searchInputAdornment} position='start'>
                  <SearchIcon fontSize='small' />
                </InputAdornment>
              ),
              endAdornment: isSearchingDataStores && (
                <InputAdornment className={cancelInputAdornment} position='end'>
                  <CancelIcon onClick={handleSearchCancel} fontSize='small' />
                </InputAdornment>
              ),
              inputProps: { 'data-testid': 'searchDataStoresTextField' },
            }}
            label='Prefix search Data Stores'
            id='search-data-stores'
            value={dataStoresSearchBoxValue}
          />
        </Grid>
        <Grid item XSmall={2}>
          <Grid container alignItems='center' justifyContent='flex-end'>
            <Switch
              aria-label='switch'
              checked={showDeleted}
              onChange={(e) => handleToggleShowDeleted(e)}
              size='small'
            />
            <Typography variant='smallLabel1' color='secondary'>
              {translate('Label.ShowDeleted')}
            </Typography>
          </Grid>
        </Grid>
      </Grid>
      <Grid container item XSmall={12}>
        <Card variant='outlined' className={dsCard}>
          <CardContent>{content}</CardContent>
        </Card>
      </Grid>
      {menuOptions}
    </Grid>
  );
};

export default withTranslation(ListDataStoresView, [TranslationNamespace.DataStoresManager]);

import React, { FunctionComponent, useState, useCallback, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  Label,
  Grid,
  FiberManualRecordIcon,
  Button,
  IconButton,
  TextField,
  Typography,
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
  CircularProgress,
  DeleteOutlinedIcon,
  Menu,
  MenuItem,
  MoreVertIcon,
  ListItemIcon,
  Select,
  useDialog,
  Divider,
  ChevronLeftIcon,
} from '@rbx/ui';
import { V2CloudProtos } from '@rbx/open-cloud';
import { Key } from '@rbx/core';
import { Locale, withTranslation, useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getResponseFromError } from '@modules/clients/utils';
import useListEntriesViewStyles from './ListEntriesView.styles';
import {
  listEntries,
  getEntry,
  listEntryVersions,
  getEntryVersion,
  updateEntry,
} from '../../openCloudStandardDataStoresRequests';
import { MAX_PAGE_SIZE, parseEntryIdAndScopeFromObjectKey, formatTimestamp } from '../../common';
import useToast from '../../utils/useToast';
import DataStoresDeletionDialog from '../DataStoresDeletionDialog/DataStoresDeletionDialog';
import EntryValueView from '../EntryValueView/EntryValueView';
import { EntryList, DataStoreState } from '../../types';
import DiffViewDialog from '../DiffViewDialog/DiffViewDialog';

interface ListEntriesViewProps {
  universeId: number;
  dataStoreName: string;
  userHasEditPermission: boolean;
  locale: Locale;
  onBack?: () => void;
}

const ListEntriesView: FunctionComponent<ListEntriesViewProps> = ({
  universeId,
  dataStoreName,
  userHasEditPermission,
  locale,
  onBack,
}) => {
  const {
    classes: {
      entryCard,
      revertButton,
      status,
      statusLabel,
      compareButton,
      toggleLabel,
      versionSelect,
      ListEntriesViewCell,
      ListEntriesViewCellDeleted,
      versionIdText,
      dataStoreTitle,
      versionList,
      listEntriesTable,
      searchInputAdornment,
      leftContainer,
      tableCellContainer,
      actionMenuCell,
      objectKeyText,
      cancelInputAdornment,
      statusText,
      listIcon,
      backToDataStoresText,
      rightContainer,
    },
  } = useListEntriesViewStyles();

  // Save entry value variables
  const scope = '-';
  const [listEntryData, setListEntryData] = useState<V2CloudProtos.IDataStoreEntry[]>([]);
  const [currentPrefix, setCurrentPrefix] = useState<string>('');
  const [originalEntry, setOriginalEntry] = useState<V2CloudProtos.IDataStoreEntry>();
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [selectedEntryValue, setSelectedEntryValue] = useState<V2CloudProtos.IDataStoreEntry>();
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [listEntryVersionsData, setListEntryVersionsData] = useState<EntryList>({
    entries: [],
    cursor: null,
  });
  const [entryScope, setEntryScope] = useState<string>('-');
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState<boolean>(false);
  const [dataStoreStatus, setDataStoreStatus] = useState<DataStoreState>(DataStoreState.ACTIVE);
  const { translate } = useTranslation();

  // Version pagination states
  const [versionsPagination, setVersionsPagination] = useState<Map<number, string | undefined>>(
    new Map(),
  );
  const [versionsPage, setVersionsPage] = useState<number>(0);
  const [isLoadingMoreVersions, setIsLoadingMoreVersions] = useState<boolean>(false);
  const [isLoadingInitialVersions, setIsLoadingInitialVersions] = useState<boolean>(false);

  // Component handling variables
  const { open, close, configure } = useDialog();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [scopeSearchValue, setScopeSearchValue] = useState<string>('global');
  const [keyNameSearchValue, setKeyNameSearchValue] = useState<string>('');
  const [isLoadingEntryValue, setIsLoadingEntryValue] = useState(false);
  const [isEntryValueError, setIsEntryValueError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const showToast = useToast();
  const [rowsPerPage, setRowsPerPage] = useState<number>(MAX_PAGE_SIZE);

  // Pagination variables
  const [entriesPagination, setEntriesPagination] = useState<Map<number, string | undefined>>(
    new Map(),
  );
  const [entriesPage, setEntriesPage] = useState<number>(0);

  const loadEntryRevisions = useCallback(
    async (scopeName: string, entry: string, pageToken?: string, pageNumber?: number) => {
      if (!pageToken) {
        setIsLoadingInitialVersions(true);
      }

      try {
        const response = await listEntryVersions(
          universeId,
          dataStoreName,
          scopeName,
          entry,
          MAX_PAGE_SIZE,
          pageToken,
        );

        if (pageToken) {
          setListEntryVersionsData((prev) => ({
            entries: [...prev.entries, ...response.entries],
            cursor: response.cursor,
          }));
        } else {
          // If we don't have a page token, we reset the page
          setListEntryVersionsData({
            entries: response.entries,
            cursor: response.cursor,
          } as EntryList);
          setVersionsPagination(new Map([[0, undefined]]));
          setVersionsPage(0);
        }

        if (response.cursor) {
          setVersionsPagination((prev) => {
            const newMap = new Map(prev);
            let nextPage;
            if (pageNumber !== undefined) {
              nextPage = pageNumber + 1;
            } else if (pageToken) {
              nextPage = Array.from(prev.keys()).length;
            } else {
              nextPage = 1;
            }
            newMap.set(nextPage, response.cursor || undefined);
            return newMap;
          });
        }
      } catch {
        setListEntryVersionsData({ entries: [], cursor: null });
      } finally {
        if (!pageToken) {
          setIsLoadingInitialVersions(false);
        }
      }
    },
    [dataStoreName, universeId],
  );

  const loadMoreVersions = useCallback(async () => {
    if (!selectedEntry || !entryScope || isLoadingMoreVersions) return;

    const currentPage = versionsPage;
    const nextPageToken = versionsPagination.get(currentPage + 1);
    if (nextPageToken) {
      setIsLoadingMoreVersions(true);
      try {
        const newPage = currentPage + 1;
        setVersionsPage(newPage);
        await loadEntryRevisions(entryScope, selectedEntry, nextPageToken, newPage);
      } finally {
        setIsLoadingMoreVersions(false);
      }
    }
  }, [
    versionsPagination,
    versionsPage,
    isLoadingMoreVersions,
    loadEntryRevisions,
    selectedEntry,
    entryScope,
  ]);

  const sentinelRef = useCallback(
    (node: HTMLLIElement | null) => {
      if (node && listEntryVersionsData.cursor && !isLoadingMoreVersions) {
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              loadMoreVersions();
            }
          },
          { threshold: 0.1 },
        );
        observer.observe(node);
        return () => observer.disconnect();
      }
      return undefined;
    },
    [listEntryVersionsData.cursor, isLoadingMoreVersions, loadMoreVersions],
  );

  const loadEntryValue = useCallback(
    async (scopeName: string, entry: string) => {
      setIsLoadingEntryValue(true);
      setIsEntryValueError(false);
      try {
        const getEntryResponse = await getEntry(universeId, dataStoreName, scopeName, entry);

        // Check if the returned value indicates a 400 error
        // getEntry returns { id: entryName, isError: true } on 400
        const responseWithError = getEntryResponse as V2CloudProtos.IDataStoreEntry & {
          isError?: boolean;
        };
        if (responseWithError.isError) {
          setIsEntryValueError(true);
          setSelectedEntryValue({
            id: entry,
            isError: true,
          } as V2CloudProtos.IDataStoreEntry & { isError?: boolean });
        } else {
          setSelectedEntryValue(getEntryResponse);
          setOriginalEntry(getEntryResponse);
        }
        return entry;
      } catch (error) {
        const response = getResponseFromError(error);
        if (response?.status === 400) {
          setIsEntryValueError(true);
          setSelectedEntryValue({
            id: entry,
            isError: true,
          } as V2CloudProtos.IDataStoreEntry & { isError?: boolean });
        }
        return entry;
      } finally {
        setIsLoadingEntryValue(false);
      }
    },
    [universeId, dataStoreName],
  );

  const loadEntryVersionValue = useCallback(
    async (scopeName: string, entry: string, version: string) => {
      setIsLoadingEntryValue(true);
      setIsEntryValueError(false);
      try {
        const getEntryVersionResponse = await getEntryVersion(
          universeId,
          dataStoreName,
          scopeName,
          entry,
          version,
        );

        // Check if the returned value indicates a 400 error
        // getEntryVersion returns { id: entryName, isError: true } on 400
        const responseWithError = getEntryVersionResponse as V2CloudProtos.IDataStoreEntry & {
          isError?: boolean;
        };
        if (responseWithError.isError) {
          setIsEntryValueError(true);
          setSelectedEntryValue({
            id: entry,
            isError: true,
          } as V2CloudProtos.IDataStoreEntry & { isError?: boolean });
        } else {
          setSelectedEntryValue(getEntryVersionResponse);
        }
        return version;
      } catch (error) {
        const response = getResponseFromError(error);
        if (response?.status === 400) {
          setIsEntryValueError(true);
          setSelectedEntryValue({
            id: entry,
            isError: true,
          } as V2CloudProtos.IDataStoreEntry & { isError?: boolean });
        }
        return version;
      } finally {
        setIsLoadingEntryValue(false);
      }
    },
    [universeId, dataStoreName],
  );

  const setupPagination = useCallback(
    async (entryList: V2CloudProtos.IDataStoreEntry[], startCursor?: string) => {
      const newMap = new Map<number, string | undefined>();
      newMap.set(0, undefined);
      setListEntryData(entryList);
      if (startCursor && startCursor !== '') {
        newMap.set(1, startCursor);
      }

      setEntriesPagination(newMap);
    },
    [],
  );

  const resetListEntriesState = useCallback(
    async (
      prefix: string,
      showDeletedParam: boolean,
      pageNumber: number,
      resetPagination: boolean,
      pageToken?: string,
      numItems?: number,
    ) => {
      setIsLoading(true);
      try {
        const response = await listEntries(
          universeId,
          dataStoreName,
          '-',
          numItems,
          pageToken,
          prefix,
          showDeletedParam,
        );

        setListEntryData(response.entries);
        setEntriesPage(pageNumber);
        setCurrentPrefix(prefix); // Set this after the API call to avoid triggering useEffect
        setDataStoreStatus(DataStoreState.ACTIVE); // Success means data store is active

        if (resetPagination) {
          setupPagination(response.entries, response.cursor ?? undefined);
        }
      } catch (error) {
        // Handle error status codes
        const response = getResponseFromError(error);
        if (response?.status === 400) {
          setDataStoreStatus(DataStoreState.DELETED);
        } else if (response?.status === 404) {
          setDataStoreStatus(DataStoreState.NOT_AVAILABLE);
        } else {
          // For other errors, keep status as ACTIVE but show empty list
          setDataStoreStatus(DataStoreState.ACTIVE);
        }
        setListEntryData([]);
        setEntriesPagination(new Map([[0, undefined]]));
      } finally {
        setIsLoading(false);
      }
    },
    [universeId, dataStoreName, setupPagination],
  );

  const handleRollbackEntry = async (
    entryId: string,
    entryValue: unknown,
    currentVersion: string,
  ) => {
    try {
      await updateEntry(universeId, dataStoreName, entryScope, entryId, entryValue, currentVersion);
      showToast('Key value reverted successfully', false);

      // Reload the entry value and versions list after successful revert
      if (selectedEntry) {
        await loadEntryValue(entryScope, selectedEntry);
        await loadEntryRevisions(entryScope, selectedEntry);
        setSelectedVersion('');
      }
    } catch {
      showToast('Failed to revert key value', true);
    }
  };

  const handleEntriesPageChange = async (page: number) => {
    try {
      const pageToken = entriesPagination.get(page);
      const response = await listEntries(
        universeId,
        dataStoreName,
        scope,
        rowsPerPage,
        pageToken,
        currentPrefix,
        showDeleted,
      );
      setListEntryData(response.entries);
      setDataStoreStatus(DataStoreState.ACTIVE);

      const newPagination = new Map(entriesPagination);
      if (!newPagination.has(page + 1)) {
        newPagination.set(page + 1, response.cursor ?? undefined);
        setEntriesPagination(newPagination);
      }

      setEntriesPage(page);
    } catch (error) {
      const response = getResponseFromError(error);
      if (response?.status === 400) {
        setDataStoreStatus(DataStoreState.DELETED);
      } else if (response?.status === 404) {
        setDataStoreStatus(DataStoreState.NOT_AVAILABLE);
      }
      setListEntryData([]);
    }
  };

  const scopeSearchValueChanged = useCallback((event: React.ChangeEvent) => {
    const { value } = event.target as HTMLInputElement;
    setScopeSearchValue(value);
  }, []);

  const keyNameSearchValueChanged = useCallback((event: React.ChangeEvent) => {
    const { value } = event.target as HTMLInputElement;
    setKeyNameSearchValue(value);
  }, []);

  const buildSearchPrefix = useCallback(() => {
    if (keyNameSearchValue.trim()) {
      return `${scopeSearchValue}/${keyNameSearchValue}`;
    }
    return scopeSearchValue.trim() ? scopeSearchValue : '';
  }, [scopeSearchValue, keyNameSearchValue]);

  const handleEntriesSearch = useCallback(
    async (prefix: string) => {
      setIsLoading(true);
      try {
        setEntriesPage(0);
        setEntriesPagination(new Map<number, string>());

        const response = await listEntries(
          universeId,
          dataStoreName,
          scope,
          MAX_PAGE_SIZE,
          undefined,
          prefix,
          showDeleted,
        );
        setListEntryData(response.entries);
        setCurrentPrefix(prefix);
        setDataStoreStatus(DataStoreState.ACTIVE);

        if (response.cursor) {
          setEntriesPagination(new Map([[1, response.cursor]]));
        }
      } catch (error) {
        const response = getResponseFromError(error);
        if (response?.status === 400) {
          setDataStoreStatus(DataStoreState.DELETED);
        } else {
          setDataStoreStatus(DataStoreState.NOT_AVAILABLE);
        }
        setListEntryData([]);
      } finally {
        setIsLoading(false);
      }
    },
    [universeId, dataStoreName, scope, showDeleted],
  );

  const searchBoxKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === Key.Enter) {
        const prefix = buildSearchPrefix();
        handleEntriesSearch(prefix);
      }
    },
    [buildSearchPrefix, handleEntriesSearch],
  );

  const handleEntryClick = useCallback(
    async (entryName: string) => {
      const { scope: parsedScope, entryId: parsedEntry } =
        parseEntryIdAndScopeFromObjectKey(entryName);
      setSelectedEntry(parsedEntry);
      setEntryScope(parsedScope);
      setSelectedVersion(''); // Reset version selection when changing entries
      setVersionsPagination(new Map()); // Reset version pagination state when changing entries
      setVersionsPage(0);
      setIsLoadingMoreVersions(false);
      setIsLoadingInitialVersions(false);

      // Don't clear the previous entry value, just start loading the new one
      try {
        await Promise.all([
          loadEntryRevisions(parsedScope, parsedEntry),
          loadEntryValue(parsedScope, parsedEntry),
        ]);
      } catch {
        // We only clear when theres an error
        setSelectedEntryValue(undefined);
        setIsEntryValueError(false);
      }
    },
    [loadEntryValue, loadEntryRevisions],
  );

  useEffect(() => {
    // Parse currentPrefix into scope and keyName
    if (currentPrefix) {
      const slashIndex = currentPrefix.indexOf('/');
      if (slashIndex !== -1) {
        setScopeSearchValue(currentPrefix.substring(0, slashIndex));
        setKeyNameSearchValue(currentPrefix.substring(slashIndex + 1));
      } else {
        setScopeSearchValue(currentPrefix);
        setKeyNameSearchValue('');
      }
    } else {
      setScopeSearchValue('global');
      setKeyNameSearchValue('');
    }
  }, [currentPrefix]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, entryId: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setEntryToDelete(entryId);
  };

  // Initial load only
  // TODO: @nchen fix the eslint
  useEffect(() => {
    handleEntriesSearch('');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we only run once on intial load
  }, []);

  // Auto-select the first version (current version) when entry versions are loaded
  useEffect(() => {
    if (listEntryVersionsData.entries && listEntryVersionsData.entries.length > 0) {
      const firstVersion = listEntryVersionsData.entries[0];
      if (firstVersion.revisionId) {
        setSelectedVersion(firstVersion.revisionId);
      }
    }
  }, [listEntryVersionsData.entries]);

  const handleToggleShowDeleted = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newShowDeleted = event.target.checked;
    setShowDeleted(newShowDeleted);
    setEntriesPage(0);

    // Reload the list with the new showDeleted value
    await resetListEntriesState(currentPrefix, newShowDeleted, 0, true, undefined, rowsPerPage);
  };

  const showSuccessMessage = useCallback(
    (success: boolean) => {
      if (success) {
        showToast('Operation successful', false);

        // If the currently selected entry is being deleted, clear the selection
        if (entryToDelete && `${entryScope}/${selectedEntry}` === entryToDelete) {
          setSelectedEntry(null);
          setSelectedEntryValue(undefined);
          setOriginalEntry(undefined);
          setIsEntryValueError(false);
          setListEntryVersionsData({ entries: [], cursor: null });
        }

        if (entryToDelete) {
          if (showDeleted) {
            setListEntryData((prevData) =>
              prevData.map((entry) =>
                entry.id === entryToDelete
                  ? { ...entry, state: V2CloudProtos.DataStoreEntry.State.DELETED }
                  : entry,
              ),
            );
          } else {
            setListEntryData((prevData) => prevData.filter((entry) => entry.id !== entryToDelete));
          }
        }
      } else {
        showToast('Key failed to delete', true);
      }
      setAnchorEl(null);
      close();
    },
    [close, showToast, entryToDelete, entryScope, selectedEntry, showDeleted],
  );

  const openEntryDialog = useCallback(
    (dataStore: string, objectKey: string) => {
      return (
        <DataStoresDeletionDialog
          universeId={universeId}
          dataStore={dataStore}
          objectKey={objectKey}
          deletion
          closeDialog={() => {
            close();
            setAnchorEl(null);
          }}
          showSuccessToast={showSuccessMessage}
        />
      );
    },
    [close, showSuccessMessage, universeId],
  );

  const openDiffViewDialog = useCallback(() => {
    return (
      <DiffViewDialog
        originalEntry={originalEntry!}
        currentEntry={selectedEntryValue!}
        versionsData={listEntryVersionsData}
        universeId={universeId}
        dataStoreName={dataStoreName}
        entryScope={entryScope}
        entryName={selectedEntry!}
        locale={locale}
        closeDialog={() => {
          close();
        }}
      />
    );
  }, [
    close,
    originalEntry,
    selectedEntryValue,
    listEntryVersionsData,
    universeId,
    dataStoreName,
    entryScope,
    selectedEntry,
    locale,
  ]);

  const menu = useMemo(() => {
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
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            configure(openEntryDialog(dataStoreName, entryToDelete ?? ''));
            open();
          }}
          data-testid={`${entryToDelete}-delete-entry-button`}>
          <ListItemIcon className={listIcon}>
            <DeleteOutlinedIcon />
          </ListItemIcon>
          <Typography>{translate('Label.MarkForDeletion')}</Typography>
        </MenuItem>
      </Menu>
    );
  }, [
    anchorEl,
    configure,
    dataStoreName,
    entryToDelete,
    open,
    openEntryDialog,
    translate,
    listIcon,
  ]);

  const content = (
    <TableContainer className={listEntriesTable}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell align='left' className={tableCellContainer}>
              Scope / Key
            </TableCell>
            {userHasEditPermission && (
              <TableCell className={tableCellContainer} align='right'>
                {translate('Label.Action')}
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {(() => {
            if (isLoading) {
              return (
                <TableRow>
                  <TableCell
                    className={tableCellContainer}
                    colSpan={userHasEditPermission ? 2 : 1}
                    align='center'>
                    <CircularProgress color='secondary' />
                  </TableCell>
                </TableRow>
              );
            }

            if (listEntryData.length > 0) {
              return listEntryData.map((entry) => (
                <TableRow
                  hover={entry.state !== V2CloudProtos.DataStoreEntry.State.DELETED}
                  key={entry.id}
                  selected={`${entryScope}/${selectedEntry}` === entry.id}
                  onClick={
                    entry.state === V2CloudProtos.DataStoreEntry.State.DELETED
                      ? undefined
                      : async () => {
                          await handleEntryClick(entry.id ?? '');
                        }
                  }
                  sx={
                    entry.state === V2CloudProtos.DataStoreEntry.State.DELETED
                      ? { cursor: 'default' }
                      : { cursor: 'pointer' }
                  }>
                  <TableCell
                    align='left'
                    className={
                      entry.state === V2CloudProtos.DataStoreEntry.State.DELETED
                        ? ListEntriesViewCellDeleted
                        : ListEntriesViewCell
                    }>
                    <div>
                      <Typography variant='body2'>
                        {entry.id
                          ? (() => {
                              const parsedValue = parseEntryIdAndScopeFromObjectKey(entry.id);
                              return (
                                <React.Fragment>
                                  <Typography className={objectKeyText} color='secondary'>
                                    {parsedValue.scope}
                                  </Typography>
                                  {' / '}
                                  <Typography className={objectKeyText}>
                                    {parsedValue.entryId}
                                  </Typography>
                                </React.Fragment>
                              );
                            })()
                          : ''}
                      </Typography>
                      {entry.state === V2CloudProtos.DataStoreEntry.State.DELETED && (
                        <Typography
                          variant='caption'
                          color='warning'
                          sx={{ display: 'block', whiteSpace: 'normal' }}>
                          ⚠️Permanent deletion begins after{' '}
                          {formatTimestamp(entry.revisionCreateTime!, locale, 30)}
                        </Typography>
                      )}
                    </div>
                  </TableCell>
                  {userHasEditPermission && (
                    <TableCell className={actionMenuCell} align='right'>
                      <IconButton
                        onClick={(event) => handleMenuOpen(event, entry.id ?? '')}
                        disabled={entry.state === V2CloudProtos.DataStoreEntry.State.DELETED}
                        data-testid={`${entry.id}-action-menu`}
                        size='small'
                        color='secondary'
                        aria-label={`${entry.id}-action-menu`}>
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ));
            }

            return (
              <TableRow>
                <TableCell colSpan={userHasEditPermission ? 2 : 1} align='center'>
                  <Typography color='secondary'>{translate('Description.NoKeysFound')}</Typography>
                </TableCell>
              </TableRow>
            );
          })()}
        </TableBody>
        {!isLoading && (
          <TableFooter>
            <TableRow data-testid='pagination-row'>
              <TablePagination
                count={-1} // Use -1 for cursor-based pagination to show next/prev buttons only
                page={entriesPage}
                rowsPerPageOptions={[10, 15, 25]}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  const numItems = parseInt(event.target.value, 10);
                  resetListEntriesState(currentPrefix, showDeleted, 0, true, undefined, numItems);
                  setRowsPerPage(numItems);
                }}
                onPageChange={(e, newPageNumber) => {
                  const targetPageCursor = entriesPagination.get(newPageNumber);
                  if (newPageNumber < entriesPage || targetPageCursor !== undefined) {
                    handleEntriesPageChange(newPageNumber);
                  }
                }}
                labelRowsPerPage='Rows per page:'
                labelDisplayedRows={() => {
                  if (listEntryData.length === 0) return '0-0';
                  const startItem = entriesPage * rowsPerPage + 1;
                  const endItem = entriesPage * rowsPerPage + listEntryData.length;
                  return `${startItem}-${endItem} results shown`;
                }}
                slotProps={{
                  actions: {
                    nextButton: {
                      disabled:
                        !entriesPagination.has(entriesPage + 1) ||
                        entriesPagination.get(entriesPage + 1) === undefined,
                    },
                    previousButton: {
                      disabled: entriesPage === 0,
                    },
                  },
                }}
              />
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </TableContainer>
  );

  return (
    <Grid container XSmall={12} spacing={1}>
      {onBack && (
        <Grid item XSmall={12} alignItems='center'>
          <IconButton
            onClick={onBack}
            size='small'
            color='secondary'
            aria-label='Back to data stores list'>
            <ChevronLeftIcon />
          </IconButton>
          <span className={backToDataStoresText}>
            <Typography variant='body2' color='secondary'>
              Back to Data Stores
            </Typography>
          </span>
        </Grid>
      )}
      <Grid container item XSmall={12} className={dataStoreTitle}>
        <Typography variant='h5'>{dataStoreName}</Typography>
      </Grid>
      <Grid item XSmall={12} direction='row' className={status} container alignItems='center'>
        <Typography variant='body2' color='secondary' className={statusText}>
          Status:
        </Typography>
        {dataStoreStatus === DataStoreState.ACTIVE && (
          <Label
            className={statusLabel}
            icon={<FiberManualRecordIcon color='success' />}
            labelText='Active'
            severity='default'
            variant='contained'
          />
        )}
        {dataStoreStatus === DataStoreState.DELETED && (
          <Label
            className={statusLabel}
            icon={<FiberManualRecordIcon color='error' />}
            labelText='Deleted'
            severity='error'
            variant='contained'
          />
        )}
        {dataStoreStatus === DataStoreState.NOT_AVAILABLE && (
          <Label
            className={statusLabel}
            icon={<FiberManualRecordIcon color='warning' />}
            labelText='Not Available'
            severity='warning'
            variant='contained'
          />
        )}
      </Grid>
      <Grid container item XSmall={12} spacing={1} alignItems='flex-start' direction='row'>
        <Grid container item XSmall={12} Small={6} spacing={1} className={leftContainer}>
          <Grid container item XSmall={12} spacing={1}>
            <Grid item XSmall={4}>
              <TextField
                fullWidth
                size='small'
                onChange={scopeSearchValueChanged}
                onKeyDown={searchBoxKeyDown}
                InputProps={{
                  endAdornment: scopeSearchValue.trim() !== '' && scopeSearchValue !== 'global' && (
                    <InputAdornment className={cancelInputAdornment} position='end'>
                      <CancelIcon
                        onClick={() => {
                          setScopeSearchValue('global');
                          const newPrefix = keyNameSearchValue.trim()
                            ? `global/${keyNameSearchValue}`
                            : 'global';
                          handleEntriesSearch(newPrefix);
                        }}
                        fontSize='small'
                        sx={{ cursor: 'pointer' }}
                      />
                    </InputAdornment>
                  ),
                  inputProps: { 'data-testid': 'searchScopeTextField' },
                  sx: {
                    '& input': {
                      color: 'text.secondary',
                    },
                  },
                }}
                label='Search by scope'
                id='search-scope'
                value={scopeSearchValue}
              />
            </Grid>
            <Grid item XSmall={8}>
              <TextField
                fullWidth
                size='small'
                onChange={keyNameSearchValueChanged}
                onKeyDown={searchBoxKeyDown}
                InputProps={{
                  startAdornment: (
                    <InputAdornment className={searchInputAdornment} position='start'>
                      <SearchIcon fontSize='small' />
                    </InputAdornment>
                  ),
                  endAdornment: keyNameSearchValue.trim() !== '' && (
                    <InputAdornment className={cancelInputAdornment} position='end'>
                      <CancelIcon
                        onClick={() => {
                          setKeyNameSearchValue('');
                          const newPrefix = scopeSearchValue.trim() || '';
                          handleEntriesSearch(newPrefix);
                        }}
                        fontSize='small'
                        sx={{ cursor: 'pointer' }}
                      />
                    </InputAdornment>
                  ),
                  inputProps: { 'data-testid': 'searchKeyNameTextField' },
                }}
                label='Search by key name'
                id='search-key-name'
                value={keyNameSearchValue}
              />
            </Grid>
          </Grid>
          <Grid item XSmall={12} container justifyContent='flex-end' alignItems='center'>
            <Switch
              disabled={isLoading}
              aria-label='switch'
              checked={showDeleted}
              onChange={(e) => handleToggleShowDeleted(e)}
              size='small'
            />
            <Typography variant='smallLabel1' color='secondary' className={toggleLabel}>
              {translate('Label.ShowDeleted')}
            </Typography>
          </Grid>
          <Grid item XSmall={12}>
            <Card variant='outlined' className={entryCard}>
              <CardContent>{content}</CardContent>
              {menu}
            </Card>
          </Grid>
        </Grid>
        <Grid container item XSmall={12} Small={6} spacing={1} className={rightContainer}>
          <Grid item XSmall={12}>
            <Card variant='outlined' className={entryCard}>
              <CardContent>
                <Grid container item XSmall={12} spacing={2}>
                  <Grid item XSmall={12}>
                    <Typography variant='body1'>
                      {selectedEntryValue?.id ?? 'No key selected'}
                    </Typography>
                  </Grid>
                  <Grid container item XSmall={12} spacing={0.5} alignItems='center'>
                    <Grid item XSmall={2}>
                      <Typography variant='body2' color='secondary'>
                        {translate('Label.KeyVersion')}
                      </Typography>
                    </Grid>
                    <Grid item XSmall={10} container justifyContent='flex-end' spacing={1}>
                      <Grid item>
                        <Select
                          size='small'
                          value={selectedVersion}
                          onChange={(e) => {
                            loadEntryVersionValue(
                              entryScope,
                              selectedEntry!,
                              e.target.value as string,
                            );
                            setSelectedVersion(e.target.value as string);
                          }}
                          displayEmpty
                          disabled={selectedVersion === ''}
                          className={versionSelect}>
                          <MenuItem value='' disabled>
                            {isLoadingInitialVersions && (
                              <CircularProgress color='secondary' size={16} />
                            )}
                            {!isLoadingInitialVersions && (
                              <React.Fragment>
                                {listEntryVersionsData.entries?.length > 0
                                  ? ''
                                  : 'No versions available'}
                              </React.Fragment>
                            )}
                          </MenuItem>
                          {!isLoadingInitialVersions &&
                            listEntryVersionsData.entries?.map((entry) => (
                              <MenuItem
                                key={entry.revisionId}
                                value={entry.revisionId || ''}
                                className={versionList}>
                                {formatTimestamp(entry.revisionCreateTime!, locale)}
                              </MenuItem>
                            ))}
                          {!isLoadingInitialVersions &&
                            listEntryVersionsData.cursor &&
                            !isLoadingMoreVersions && <MenuItem ref={sentinelRef} disabled />}
                          {!isLoadingInitialVersions && isLoadingMoreVersions && (
                            <MenuItem disabled>
                              <CircularProgress size={14} />
                            </MenuItem>
                          )}
                        </Select>
                      </Grid>
                      <Grid item>
                        <Button
                          variant='contained'
                          size='small'
                          color='secondary'
                          disabled={selectedVersion === '' || !userHasEditPermission}
                          className={revertButton}
                          onClick={() =>
                            handleRollbackEntry(
                              selectedEntryValue?.id ?? '',
                              selectedEntryValue?.value ?? '',
                              listEntryVersionsData.entries[0]?.revisionId ?? '',
                            )
                          }>
                          {translate('Label.Revert')}
                        </Button>
                      </Grid>
                      <Grid item>
                        <Button
                          variant='contained'
                          size='small'
                          color='secondary'
                          disabled={selectedVersion === ''}
                          className={compareButton}
                          onClick={() => {
                            configure(openDiffViewDialog());
                            open();
                          }}>
                          {translate('Label.CompareVersions')}
                        </Button>
                      </Grid>
                    </Grid>
                    <Grid item XSmall={12}>
                      <Divider />
                    </Grid>
                  </Grid>
                  <Grid container item XSmall={12} spacing={1}>
                    <Grid item XSmall={5}>
                      <Typography variant='body2' color='secondary'>
                        {translate('Label.VersionId')}
                      </Typography>
                    </Grid>
                    <Grid item XSmall={7} container justifyContent='flex-end'>
                      <Typography variant='body2' color='secondary' className={versionIdText}>
                        {selectedEntryValue?.revisionId ?? '--'}
                      </Typography>
                    </Grid>
                    <Grid item XSmall={12}>
                      <Divider />
                    </Grid>
                  </Grid>
                  <Grid item XSmall={12}>
                    <EntryValueView
                      value={selectedEntryValue}
                      isLoading={isLoadingEntryValue}
                      isError={isEntryValueError}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default withTranslation(ListEntriesView, [TranslationNamespace.DataStoresManager]);

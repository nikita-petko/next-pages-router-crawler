import type { FunctionComponent } from 'react';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import type {
  PlaceFilter,
  RestartsLaunchRestartRequest,
} from '@rbx/client-server-management-service/v1';
import { Icon, ListItem } from '@rbx/foundation-ui';
import { useTranslation, Locale, useLocalization } from '@rbx/intl';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import {
  Typography,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  Button,
  IconButton,
  TablePagination,
  Card,
} from '@rbx/ui';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import {
  POLLING_CONSTANTS,
  DATE_FORMAT_CONSTANTS,
  DEFAULT_VALUES,
  DISPLAY_CONSTANTS,
  PAGINATION_CONSTANTS,
} from '../../constants';
import ServerManagementTabs from '../../enums/ServerManagementTabs';
import useServerManagementV2 from '../../hooks/useServerManagementV2';
import useUniversePlaces from '../../hooks/useUniversePlaces';
import type { Place } from '../../types/Place';
import type { PlaceSummaryV2 } from '../../types/PlaceSummary';
import useToast from '../../utils/useToast';
import RestartServersModalV2 from '../RestartServersModal/RestartServersModalV2';
import useSelectablePlacesTableV2Styles from './SelectablePlacesTableV2.styles';

type Props = {
  onSelectionChange?: (selected: number[]) => void;
  clearSelectionTrigger?: number;
};

const SelectablePlacesTableV2: FunctionComponent<Props> = ({
  onSelectionChange,
  clearSelectionTrigger,
}) => {
  const { classes } = useSelectablePlacesTableV2Styles();
  const { gameDetails } = useCurrentGame();
  const { translate } = useTranslation();
  const { locale } = useLocalization();

  const {
    searchRestartContainer,
    searchField,
    searchIcon,
    tableContainer,
    table,
    placesColumn,
    publishedOnColumn,
    activeServersColumn,
    outdatedServersColumn,
    viewDetailsColumn,
    placeRow,
    placesHeader,
    placeCheckbox,
    placeRowWithCheckbox,
    placeAvatar,
    placeListItem,
    emptyStateCell,
    publishedOnText,
    paginationToolbar,
  } = classes;

  const { handleForecastRestart, handleLaunchRestart } = useServerManagementV2();

  const { placesInfo, isPlacesLoading, getPlacesError } = useUniversePlaces();

  const router = useRouter();
  const [, setQueryParamValues] = useQueryParams(['activeTab']);

  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [isRestarting, setIsRestarting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const showToast = useToast();

  const handleRestartServers = useCallback(() => {
    if (selected.length === 0) {
      return;
    }
    setIsModalOpen(true);
  }, [selected.length]);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleModalConfirm = useCallback(
    async (options: {
      restartOutdatedOnly: boolean;
      bleedOffMinutes?: string;
      customPayload?: string;
    }) => {
      setIsRestarting(true);
      setIsModalOpen(false);

      try {
        const selectedPlacesWithUpdates = places.filter(
          (place) =>
            selected.includes(place.id) &&
            (options.restartOutdatedOnly ? place.outdatedServers > 0 : true),
        );

        if (selectedPlacesWithUpdates.length === 0) {
          return;
        }

        const placeFilters: { [key: string]: PlaceFilter } = {};
        selectedPlacesWithUpdates.forEach((place) => {
          placeFilters[place.id.toString()] = {
            // || intentional: convert false to undefined so the field is omitted from the request
            excludeCurrentVersion: options.restartOutdatedOnly || undefined,
          };
        });
        const launchRequest: RestartsLaunchRestartRequest = {
          ...(options.bleedOffMinutes && {
            bleedOffDurationMinutes: parseInt(options.bleedOffMinutes, 10),
          }),
          ...(options.customPayload && {
            attributes: JSON.parse(options.customPayload) as unknown,
          }),
          places: placeFilters,
        };

        const response = await handleLaunchRestart(launchRequest);

        if (response) {
          setSelected([]);
          setQueryParamValues({ activeTab: ServerManagementTabs.RestartMonitor.toString() });
        }
      } catch {
        showToast(translate('SelectablePlacesTable.Snackbar.ErrorLaunchingRestart'));
      } finally {
        setIsRestarting(false);
      }
    },
    [places, handleLaunchRestart, selected, setQueryParamValues, showToast, translate],
  );

  const handleForecastUpdateFailure = useCallback(() => {
    setSelected([]);
  }, []);

  const fetchPlaces = useCallback(async () => {
    if (!gameDetails?.id) {
      return;
    }

    let placeForecasts: Record<string, PlaceSummaryV2> | null | undefined = null;
    try {
      const forecastResponse = await handleForecastRestart();
      placeForecasts = forecastResponse.placeForecasts;
    } catch {
      // Fall through with null placeForecasts so places still render with default values
    }

    const allPlaces: Place[] = placesInfo.map((placeInfo) => {
      const placeId = placeInfo.placeId ?? DEFAULT_VALUES.PLACE_ID;
      const placeSummary =
        placeForecasts && typeof placeForecasts === 'object'
          ? placeForecasts[placeId.toString()]
          : null;

      return {
        id: placeId,
        name: placeInfo.name ?? `${placeId}`,
        publishedVersion:
          (placeSummary?.latestPlaceVersion != null
            ? Number(placeSummary.latestPlaceVersion)
            : null) ??
          placeInfo.publishedVersion ??
          DEFAULT_VALUES.PUBLISHED_VERSION,
        publishedOn:
          placeSummary?.publishTime?.toISOString() ??
          placeInfo.publishedOn ??
          new Date().toISOString(),
        servers: placeSummary?.totalInstances ?? DEFAULT_VALUES.SERVERS,
        outdatedServers: placeSummary?.instancesImpacted ?? DEFAULT_VALUES.OUTDATED_SERVERS,
        players: placeSummary?.totalPlayers ?? DEFAULT_VALUES.PLAYERS,
        playersOnOutdated: placeSummary?.playersImpacted ?? DEFAULT_VALUES.PLAYERS_ON_OUTDATED,
        thumbnailUrl: placeInfo.thumbnailUrl,
        thumbnail: placeInfo.thumbnail,
      };
    });

    setPlaces(allPlaces);
    if (allPlaces.length === 0) {
      setSelected([]);
    }
  }, [gameDetails?.id, handleForecastRestart, placesInfo]);

  useEffect(() => {
    void fetchPlaces();
  }, [fetchPlaces]);

  useEffect(() => {
    if (gameDetails?.id) {
      const interval = setInterval(() => {
        void fetchPlaces();
      }, POLLING_CONSTANTS.INTERVAL_MS);

      return () => clearInterval(interval);
    }
    return undefined;
  }, [fetchPlaces, gameDetails?.id]);

  useEffect(() => {
    if (clearSelectionTrigger && clearSelectionTrigger > 0) {
      setSelected([]);
    }
  }, [clearSelectionTrigger]);

  useEffect(() => {
    setPage(0);
  }, [search]);

  const handleSelect = useCallback((id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const filteredPlaces = useMemo(
    () => places.filter((place) => place.name.toLowerCase().includes(search.toLowerCase())),
    [places, search],
  );

  const paginatedPlaces = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredPlaces.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredPlaces, page, rowsPerPage]);

  const restartButtonText = useMemo(() => {
    if (selected.length > 0 && selected.length !== places.length) {
      const serverCount = places
        .filter((place) => selected.includes(place.id) && typeof place.servers === 'number')
        .reduce((sum, curr) => sum + curr.servers, 0);
      if (serverCount > 0) {
        const numberFormat = Intl.NumberFormat(locale ?? Locale.English, {});
        const server = numberFormat.format(serverCount);
        return translate('SelectablePlacesTable.Button.RestartXServers', { count: server });
      }
    }
    return translate('SelectablePlacesTable.Button.RestartServers');
  }, [selected, places, locale, translate]);

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(filteredPlaces.map((place) => place.id));
    } else {
      setSelected([]);
    }
  };

  const handleViewDetails = useCallback(
    (placeId: number) => {
      const universeId = String(router.query.id ?? '');
      void router.push(
        `/dashboard/creations/experiences/${universeId}/server-management/${placeId}/servers`,
      );
    },
    [router],
  );

  const allSelected =
    filteredPlaces.length > 0 && filteredPlaces.every((place) => selected.includes(place.id));

  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selected);
    }
  }, [selected, onSelectionChange]);

  const getPlaceBreakdownTranslation = (servers: number, players: number) => {
    if (servers === 0) {
      return DISPLAY_CONSTANTS.EMPTY_PLACEHOLDER;
    }

    const numberFormat = Intl.NumberFormat(locale ?? Locale.English, {});
    const server = numberFormat.format(servers);
    const player = numberFormat.format(players);

    if (servers === 1 && players === 1) {
      return translate('SelectablePlacesTable.Cell.ServerPlayerBreakdown', { server, player });
    }
    if (servers === 1 && players !== 1) {
      return translate('SelectablePlacesTable.Cell.ServerPlayersBreakdown', { server, player });
    }
    if (servers !== 1 && players === 1) {
      return translate('SelectablePlacesTable.Cell.ServersPlayerBreakdown', { server, player });
    }
    return translate('SelectablePlacesTable.Cell.ServersPlayersBreakdown', { server, player });
  };

  const formatPublishedOn = useCallback(
    (publishedOn: string) => {
      const d = new Date(publishedOn);
      const date = d.toLocaleDateString(
        DATE_FORMAT_CONSTANTS.LOCALE,
        DATE_FORMAT_CONSTANTS.DATE_OPTIONS,
      );
      const time = d.toLocaleTimeString(
        DATE_FORMAT_CONSTANTS.LOCALE,
        DATE_FORMAT_CONSTANTS.TIME_OPTIONS,
      );
      return translate('SelectablePlacesTable.Cell.PublishedDate', { date, time });
    },
    [translate],
  );

  if (isPlacesLoading) {
    return (
      <div>
        <Typography variant='body1' color='secondary'>
          {translate('SelectablePlacesTable.Loading')}
        </Typography>
      </div>
    );
  }

  if (getPlacesError) {
    return (
      <div>
        <Typography variant='body1' color='error'>
          {translate('SelectablePlacesTable.Error', { error: getPlacesError.message })}
        </Typography>
      </div>
    );
  }

  return (
    <div>
      <div className={searchRestartContainer}>
        <TextField
          placeholder={translate('SelectablePlacesTable.Search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={searchField}
          label={undefined}
          id='search-places'
          size='small'
          InputProps={{
            startAdornment: (
              <span className={searchIcon}>
                <Icon name='icon-regular-magnifying-glass' />
              </span>
            ),
          }}
        />
        <Button
          variant='contained'
          color='primaryBrand'
          disabled={selected.length === 0 || isRestarting}
          onClick={handleRestartServers}>
          {restartButtonText}
        </Button>
      </div>
      <Card variant='outlined' className={tableContainer}>
        <Table className={table}>
          <TableHead>
            <TableRow>
              <TableCell className={placesColumn}>
                <div className={placesHeader}>
                  <Checkbox
                    checked={allSelected}
                    indeterminate={selected.length > 0 && !allSelected}
                    onChange={handleSelectAll}
                    size='large'
                    color='secondary'
                    className={placeCheckbox}
                  />
                  {translate('SelectablePlacesTable.Column.Place')}
                </div>
              </TableCell>
              <TableCell className={activeServersColumn}>
                {translate('SelectablePlacesTable.Column.ActiveServers')}
              </TableCell>
              <TableCell className={outdatedServersColumn}>
                {translate('SelectablePlacesTable.Column.ActiveServersToClose')}
              </TableCell>
              <TableCell className={publishedOnColumn}>
                {translate('SelectablePlacesTable.Column.LastPublishedOn')}
              </TableCell>
              <TableCell className={viewDetailsColumn} />
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedPlaces.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className={emptyStateCell}>
                  <Typography variant='body1' color='secondary'>
                    {search.trim()
                      ? translate('SelectablePlacesTable.Empty.NoPlacesFound')
                      : translate('SelectablePlacesTable.Empty.NoServerUpdates')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedPlaces.map((place) => (
                <TableRow
                  key={place.id}
                  className={placeRow}
                  hover
                  selected={selected.includes(place.id)}
                  onClick={() => handleViewDetails(place.id)}>
                  <TableCell className={placesColumn}>
                    <div className={placeRowWithCheckbox}>
                      <Checkbox
                        checked={selected.includes(place.id)}
                        onChange={() => handleSelect(place.id)}
                        onClick={(e) => e.stopPropagation()}
                        size='large'
                        color='secondary'
                        className={placeCheckbox}
                      />
                      <div className={placeAvatar}>
                        {place.thumbnail ?? (
                          <Thumbnail2d
                            targetId={place.id}
                            type={ThumbnailTypes.placeIcon}
                            alt={place.name}
                            returnPolicy={ReturnPolicy.PlaceHolder}
                          />
                        )}
                      </div>
                      <ListItem
                        divider='None'
                        isContained
                        leading={null}
                        metadata={translate('SelectablePlacesTable.Cell.PlaceId', {
                          placeId: place.id.toString(),
                        })}
                        title={place.name}
                        trailing={null}
                        className={placeListItem}
                      />
                    </div>
                  </TableCell>
                  <TableCell className={activeServersColumn}>
                    {getPlaceBreakdownTranslation(place.servers, place.players)}
                  </TableCell>
                  <TableCell className={outdatedServersColumn}>
                    {getPlaceBreakdownTranslation(place.outdatedServers, place.playersOnOutdated)}
                  </TableCell>
                  <TableCell className={publishedOnColumn}>
                    <Typography variant='body2' className={publishedOnText}>
                      {formatPublishedOn(place.publishedOn)}
                    </Typography>
                  </TableCell>
                  <TableCell className={viewDetailsColumn} align='right'>
                    <IconButton
                      aria-label='view details'
                      onClick={() => handleViewDetails(place.id)}
                      size='small'
                      color='secondary'>
                      <Icon name='icon-filled-chevron-small-right' />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
      <div className={paginationToolbar}>
        <TablePagination
          component='div'
          page={page}
          rowsPerPageOptions={PAGINATION_CONSTANTS.ROWS_PER_PAGE_OPTIONS}
          count={filteredPlaces.length}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </div>
      <RestartServersModalV2
        open={isModalOpen}
        onClose={handleModalClose}
        selectedPlaces={selected}
        onConfirm={handleModalConfirm}
        onForecastUpdateFailure={handleForecastUpdateFailure}
      />
    </div>
  );
};

export default SelectablePlacesTableV2;

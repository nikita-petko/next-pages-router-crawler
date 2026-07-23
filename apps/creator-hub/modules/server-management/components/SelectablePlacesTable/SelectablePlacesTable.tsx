import React, { FunctionComponent, useEffect, useState, useCallback, useMemo } from 'react';
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
} from '@rbx/ui';
import { Icon } from '@rbx/foundation-ui';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useTranslation, Locale, useLocalization } from '@rbx/intl';
import useSelectablePlacesTableStyles from './SelectablePlacesTable.styles';
import useServerManagement from '../../hooks/useServerManagement';
import useUniversePlaces from '../../hooks/useUniversePlaces';
import useToast from '../../utils/useToast';
import RestartServersModal from '../RestartServersModal/RestartServersModal';
import { POLLING_CONSTANTS, DATE_FORMAT_CONSTANTS, DEFAULT_VALUES } from '../../constants';
import { Place } from '../../types/Place';
import { PlaceSummary } from '../../types/PlaceSummary';

type Props = {
  onSelectionChange?: (selected: number[]) => void;
  clearSelectionTrigger?: number;
};

const SelectablePlacesTable: FunctionComponent<Props> = ({
  onSelectionChange,
  clearSelectionTrigger,
}) => {
  const { classes } = useSelectablePlacesTableStyles();
  const { gameDetails } = useCurrentGame();
  const { translate } = useTranslation();
  const { locale } = useLocalization();

  const {
    searchContainer,
    searchField,
    searchIcon,
    tableContainer,
    table,
    placesColumn,
    publishedVersionColumn,
    publishedOnColumn,
    serversColumn,
    outdatedServersColumn,
    playersColumn,
    playersOnOutdatedColumn,
    placesHeader,
    placeCheckbox,
    placeRowWithCheckbox,
    placeAvatar,
    placeName,
    emptyStateCell,
    publishedOnText,
    buttonContainer,
  } = classes;

  const { handleForecastUpdate, handleLaunchUpdate } = useServerManagement();

  const { placesInfo, isPlacesLoading, getPlacesError } = useUniversePlaces();

  const [selected, setSelected] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [isRestarting, setIsRestarting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const showToast = useToast();

  const handleRestartServers = useCallback(() => {
    if (selected.length === 0) return;
    setIsModalOpen(true);
  }, [selected.length]);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleModalConfirm = useCallback(
    async (options: { restartOutdatedOnly: boolean; bleedOffMinutes?: string }) => {
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

        const launchRequest = {
          placeIds: selectedPlacesWithUpdates.map((place) => place.id),
          closeOldVersionsOnly: options.restartOutdatedOnly,
          bleedOffServers: !!options.bleedOffMinutes,
          ...(options.bleedOffMinutes && {
            bleedOffDurationMinutes: parseInt(options.bleedOffMinutes, 10),
          }),
        };

        const response = await handleLaunchUpdate(launchRequest);

        if (response) {
          setSelected([]);
        }
      } catch {
        showToast(translate('SelectablePlacesTable.Snackbar.ErrorLaunchingRestart'));
      } finally {
        setIsRestarting(false);
      }
    },
    [places, handleLaunchUpdate, selected, showToast, translate],
  );

  const handleForecastUpdateFailure = useCallback(() => {
    setSelected([]);
  }, []);

  const fetchPlaces = useCallback(async () => {
    if (!gameDetails?.id) return;

    try {
      const forecastResponse = await handleForecastUpdate();
      const allPlaces: Place[] = [];
      const { placeSummaries } = forecastResponse;

      if (Array.isArray(placeSummaries)) {
        placeSummaries.forEach((placeSummary: PlaceSummary) => {
          if (placeSummary && typeof placeSummary === 'object') {
            const placeId = placeSummary.placeId || DEFAULT_VALUES.PLACE_ID;
            const placeInfo = placesInfo.find(
              (place) => place.placeId !== undefined && place.placeId === placeId,
            );

            allPlaces.push({
              id: placeId,
              name: placeInfo?.name || `${placeId}`,
              publishedVersion:
                placeSummary.placeVersion ??
                placeInfo?.publishedVersion ??
                DEFAULT_VALUES.PUBLISHED_VERSION,
              publishedOn:
                placeSummary.lastUpdated?.toISOString() ??
                placeInfo?.publishedOn ??
                new Date().toISOString(),
              servers: placeSummary.totalInstances || DEFAULT_VALUES.SERVERS,
              outdatedServers: placeSummary.instancesToBeClosed || DEFAULT_VALUES.OUTDATED_SERVERS,
              players: placeSummary.totalPlayers || DEFAULT_VALUES.PLAYERS,
              playersOnOutdated:
                placeSummary.playersToBeKicked || DEFAULT_VALUES.PLAYERS_ON_OUTDATED,
              thumbnailUrl: placeInfo?.thumbnailUrl,
              thumbnail: placeInfo?.thumbnail,
            });
          }
        });
      }

      setPlaces(allPlaces);
      if (allPlaces.length === 0) {
        setSelected([]);
      }
    } catch {
      setPlaces([]);
      setSelected([]);
    }
  }, [gameDetails?.id, handleForecastUpdate, placesInfo]);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  useEffect(() => {
    if (gameDetails?.id) {
      const interval = setInterval(() => {
        fetchPlaces();
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

  const handleSelect = (id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const filteredPlaces = useMemo(
    () => places.filter((place) => place.name.toLowerCase().includes(search.toLowerCase())),
    [places, search],
  );

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(filteredPlaces.map((place) => place.id));
    } else {
      setSelected([]);
    }
  };

  const allSelected =
    filteredPlaces.length > 0 && filteredPlaces.every((place) => selected.includes(place.id));

  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selected);
    }
  }, [selected, onSelectionChange]);

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

  const formatPublishedOn = (publishedOn: string) => {
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
  };

  return (
    <div>
      <div>
        <Typography variant='h5' component='h5' mt={4}>
          {translate('SelectablePlacesTable.Title')}
        </Typography>
        <Typography variant='body1' component='p' mt={1}>
          {translate('SelectablePlacesTable.Subtitle')}
        </Typography>
      </div>
      <div className={searchContainer}>
        <TextField
          placeholder={translate('SelectablePlacesTable.Search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={searchField}
          label={undefined}
          id='search-places'
          InputProps={{
            startAdornment: (
              <span className={searchIcon}>
                <Icon name='icon-regular-magnifying-glass' />
              </span>
            ),
          }}
        />
      </div>
      <div className={tableContainer}>
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
                  {translate('SelectablePlacesTable.Column.Places')}
                </div>
              </TableCell>
              <TableCell className={publishedVersionColumn}>
                {translate('SelectablePlacesTable.Column.PublishedVersion')}
              </TableCell>
              <TableCell className={publishedOnColumn}>
                {translate('SelectablePlacesTable.Column.PublishedOn')}
              </TableCell>
              <TableCell className={serversColumn}>
                {translate('SelectablePlacesTable.Column.TotalServers')}
              </TableCell>
              <TableCell className={outdatedServersColumn}>
                {translate('SelectablePlacesTable.Column.ServersToClose')}
              </TableCell>
              <TableCell className={playersColumn}>
                {translate('SelectablePlacesTable.Column.TotalPlayers')}
              </TableCell>
              <TableCell className={playersOnOutdatedColumn}>
                {translate('SelectablePlacesTable.Column.PlayersToKick')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPlaces.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className={emptyStateCell}>
                  <Typography variant='body1' color='secondary'>
                    {search.trim()
                      ? translate('SelectablePlacesTable.Empty.NoPlacesFound')
                      : translate('SelectablePlacesTable.Empty.NoServerUpdates')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredPlaces.map((place) => (
                <TableRow key={place.id} hover selected={selected.includes(place.id)}>
                  <TableCell className={placesColumn}>
                    <div className={placeRowWithCheckbox}>
                      <Checkbox
                        checked={selected.includes(place.id)}
                        onChange={() => handleSelect(place.id)}
                        size='large'
                        color='secondary'
                        className={placeCheckbox}
                      />
                      <div className={placeAvatar}>
                        {place.thumbnail ? (
                          place.thumbnail
                        ) : (
                          <Thumbnail2d
                            targetId={place.id}
                            type={ThumbnailTypes.placeIcon}
                            alt={place.name}
                            returnPolicy={ReturnPolicy.PlaceHolder}
                          />
                        )}
                      </div>
                      <Typography variant='body2' className={placeName}>
                        {place.name}
                      </Typography>
                    </div>
                  </TableCell>
                  <TableCell className={publishedVersionColumn}>{place.publishedVersion}</TableCell>
                  <TableCell className={publishedOnColumn}>
                    <Typography variant='body2' className={publishedOnText}>
                      {formatPublishedOn(place.publishedOn)}
                    </Typography>
                  </TableCell>
                  <TableCell className={serversColumn}>
                    {Intl.NumberFormat(locale ?? Locale.English, {}).format(place.servers)}
                  </TableCell>
                  <TableCell className={outdatedServersColumn}>
                    {Intl.NumberFormat(locale ?? Locale.English, {}).format(place.outdatedServers)}
                  </TableCell>
                  <TableCell className={playersColumn}>
                    {Intl.NumberFormat(locale ?? Locale.English, {}).format(place.players)}
                  </TableCell>
                  <TableCell className={playersOnOutdatedColumn}>
                    {Intl.NumberFormat(locale ?? Locale.English, {}).format(
                      place.playersOnOutdated,
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className={buttonContainer}>
        <Button
          variant='contained'
          color='primaryBrand'
          disabled={selected.length === 0 || isRestarting}
          onClick={handleRestartServers}>
          {translate('SelectablePlacesTable.Button.RestartServers')}
        </Button>
      </div>
      <RestartServersModal
        open={isModalOpen}
        onClose={handleModalClose}
        selectedPlaces={selected}
        onConfirm={handleModalConfirm}
        onForecastUpdateFailure={handleForecastUpdateFailure}
      />
    </div>
  );
};

export default SelectablePlacesTable;

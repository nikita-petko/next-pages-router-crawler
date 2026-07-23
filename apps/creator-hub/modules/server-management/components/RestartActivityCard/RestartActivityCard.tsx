import React, { useState, useEffect } from 'react';
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Card,
  Chip,
  IconButton,
  ExpandMoreIcon,
  ExpandLessIcon,
  Button,
  Link,
} from '@rbx/ui';
import {
  GetUpdateStatusResponse,
  GameUpdateStatus,
  PlaceUpdateStatus,
} from '@rbx/clients/matchmakingApi/v1';
import { useTranslation } from '@rbx/intl';
import useRestartActivityCardStyles from './RestartActivityCard.styles';
import useServerManagementV2Gate from '../../hooks/useServerManagementV2Gate';
import useServerManagement from '../../hooks/useServerManagement';
import useUniversePlaces from '../../hooks/useUniversePlaces';
import UpdatePhase from '../../enums/UpdatePhase';
import { DATE_FORMAT_CONSTANTS, UI_CONSTANTS, DOCUMENTATION_CONSTANTS } from '../../constants';
import PlacesModal from '../PlacesModal/PlacesModal';
import RestartDetails from '../RestartDetails/RestartDetails';
import RestartProgress from '../RestartProgress/RestartProgress';

type RestartActivityCardProps = {
  className?: string;
};

const RestartActivityCard: React.FC<RestartActivityCardProps> = () => {
  const { classes } = useRestartActivityCardStyles();
  const {
    emptyState,
    table,
    tableV2,
    tableContainer,
    tableContainerV2,
    tableElement,
    statusChip,
    statusIndicator,
    statusIndicatorCompleted,
    statusIndicatorInProgress,
    statusIndicatorUnknown,
    placesContainer,
    placeItem,
    moreButton,
    chevronColumn,
    chevronButton,
    expandedRow,
    mainRowWithExpanded,
    expandedContent,
    expandedContentContainer,
    detailCard,
  } = classes;
  const { handleGetUpdateStatus } = useServerManagement();
  const { placesInfo } = useUniversePlaces();
  const { translate, translateHTML } = useTranslation();
  const isV2Enabled = useServerManagementV2Gate();

  const [updateStatus, setUpdateStatus] = useState<GetUpdateStatusResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlaces, setSelectedPlaces] = useState<
    Array<{ id: number; name: string; version: number }>
  >([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRowExpansion = (updateId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(updateId)) {
        newSet.delete(updateId);
      } else {
        newSet.add(updateId);
      }
      return newSet;
    });
  };

  const documentationUrl = DOCUMENTATION_CONSTANTS.SERVER_RESTART_DOCS;

  useEffect(() => {
    const fetchUpdateStatus = async () => {
      try {
        const response = await handleGetUpdateStatus();
        if (response) {
          // Only update state if we have new data to prevent flickering
          setUpdateStatus((prevStatus) => {
            if (
              prevStatus &&
              prevStatus.updateStatusList &&
              response.updateStatusList &&
              prevStatus.updateStatusList.length === response.updateStatusList.length &&
              JSON.stringify(prevStatus.updateStatusList) ===
                JSON.stringify(response.updateStatusList)
            ) {
              return prevStatus;
            }

            if (response.updateStatusList) {
              const activeUpdateIds = response.updateStatusList
                .filter((update) => {
                  const placeStatuses = Object.values(update.placeUpdateStatuses || {});
                  return placeStatuses.some(
                    (status) =>
                      status.phase === UpdatePhase.BleedOff || status.phase === UpdatePhase.Migrate,
                  );
                })
                .map((update) => update.id || '')
                .filter((id) => id);

              if (activeUpdateIds.length > 0) {
                setExpandedRows((prev) => {
                  const newSet = new Set(prev);
                  activeUpdateIds.forEach((id) => newSet.add(id));
                  return newSet;
                });
              }
            }

            return response;
          });
        }
      } catch {
        // Do nothing on error
      }
    };
    fetchUpdateStatus();

    const interval = setInterval(() => fetchUpdateStatus(), 5000);

    return () => clearInterval(interval);
  }, [handleGetUpdateStatus]);

  const getStatusDisplay = (update: GameUpdateStatus) => {
    const placeStatuses = Object.values(update.placeUpdateStatuses || {});
    if (placeStatuses.length === 0)
      return { text: 'Unknown', indicatorClass: statusIndicatorUnknown };

    const phases = placeStatuses
      .map((status: PlaceUpdateStatus) => status.phase)
      .filter((phase): phase is string => phase !== null && phase !== undefined);

    if (phases.length === 0) return { text: 'Unknown', indicatorClass: statusIndicatorUnknown };

    const hasInProgressServers = phases.some(
      (phase) => phase === UpdatePhase.BleedOff || phase === UpdatePhase.Migrate,
    );

    const allServersDone = phases.every((phase) => phase === UpdatePhase.Done);

    if (hasInProgressServers) {
      return {
        text: translate('RestartActivityCard.InProgress'),
        indicatorClass: statusIndicatorInProgress,
      };
    }
    if (allServersDone) {
      return {
        text: translate('RestartActivityCard.Completed'),
        indicatorClass: statusIndicatorCompleted,
      };
    }
    return {
      text: translate('RestartActivityCard.Unknown'),
      indicatorClass: statusIndicatorUnknown,
    };
  };

  const getPlacesList = (update: GameUpdateStatus) => {
    const placeStatuses = Object.values(update.placeUpdateStatuses || {});
    const places = placeStatuses.map((status: PlaceUpdateStatus) => {
      const placeInfo = placesInfo.find((place) => place.placeId === status.placeId);
      const placeName =
        placeInfo?.name ||
        `${translate('RestartActivityCard.PlaceIdHolder', { placeId: status.placeId?.toString() || '0' })}`;
      return {
        name: placeName,
        id: placeInfo?.placeId ?? 0,
        version: status.placeVersion,
      };
    });

    return {
      places: places.slice(0, UI_CONSTANTS.MAX_VISIBLE_PLACES),
      totalCount: places.length,
      hasMore: places.length > UI_CONSTANTS.MAX_VISIBLE_PLACES,
    };
  };

  const getAllPlaces = (
    places: { name: string; id: number; version: number | undefined }[],
    update: GameUpdateStatus,
  ) => {
    const placeInfoMap = new Map(placesInfo.map((p) => [p.placeId, p.name]));
    return [
      ...places.map((p) => ({
        id: p.id,
        name: p.name,
        version: p.version ?? 0,
      })),
      ...Object.values(update.placeUpdateStatuses ?? {})
        .slice(UI_CONSTANTS.MAX_VISIBLE_PLACES)
        .map((status: PlaceUpdateStatus) => {
          const placeName = placeInfoMap.get(status.placeId ?? 0);
          return {
            id: status.placeId ?? 0,
            name:
              placeName ??
              `${translate('RestartActivityCard.PlaceIdHolder', { placeId: status.placeId?.toString() ?? '0' })}`,
            version: status.placeVersion ?? 0,
          };
        }),
    ];
  };

  const updates = (updateStatus?.updateStatusList || []).slice().reverse();

  if (updates.length === 0) {
    return (
      <div>
        <Typography variant='h5' component='h5' mt={4}>
          {translate('RestartActivityCard.Title')}
        </Typography>
        <Typography variant='body1' component='p' mt={1}>
          {translateHTML('RestartActivityCard.Description', [
            {
              opening: 'linkStart',
              closing: 'linkEnd',
              content(chunks) {
                return (
                  <Link href={documentationUrl} target='_blank' underline='always'>
                    {chunks}
                  </Link>
                );
              },
            },
          ])}
        </Typography>
        <Card variant='outlined' className={emptyState}>
          <Typography variant='body1' color='secondary'>
            {translate('RestartActivityCard.NoActiveOrRecentServerRestarts')}
          </Typography>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {!isV2Enabled && (
        <React.Fragment>
          <Typography variant='h5' component='h5' mt={5}>
            {translate('RestartActivityCard.Title')}
          </Typography>
          <Typography variant='body1' component='p' mt={1}>
            {translateHTML('RestartActivityCard.Description', [
              {
                opening: 'linkStart',
                closing: 'linkEnd',
                content(chunks) {
                  return (
                    <Link href={documentationUrl} target='_blank' underline='always'>
                      {chunks}
                    </Link>
                  );
                },
              },
            ])}
          </Typography>
        </React.Fragment>
      )}
      <Card variant='outlined' className={isV2Enabled ? tableV2 : table}>
        <div className={isV2Enabled ? tableContainerV2 : tableContainer}>
          <Table className={tableElement}>
            <TableHead>
              <TableRow>
                <TableCell>{translate('RestartActivityCard.RestartStatus')}</TableCell>
                <TableCell>{translate('RestartActivityCard.PlacesAndVersionAtRestart')}</TableCell>
                <TableCell>{translate('RestartActivityCard.StartTime')}</TableCell>
                <TableCell className={chevronColumn} />
              </TableRow>
            </TableHead>
            <TableBody>
              {updates.map((update: GameUpdateStatus) => {
                const statusDisplay = getStatusDisplay(update);
                const placesData = getPlacesList(update);
                const isExpanded = expandedRows.has(update.id || '');

                return (
                  <React.Fragment key={update.id}>
                    <TableRow className={isExpanded ? mainRowWithExpanded : ''}>
                      <TableCell>
                        <Chip
                          label={statusDisplay.text}
                          className={statusChip}
                          icon={
                            <div className={`${statusIndicator} ${statusDisplay.indicatorClass}`} />
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className={placesContainer}>
                          {placesData.places.map((place, placeIndex) => (
                            <div
                              key={`${update.id}-place-${place.name.replace(/[^a-zA-Z0-9]/g, '-')}-${place.version}`}
                              className={placeItem}>
                              {place.name}
                              <span>&nbsp;(v</span>
                              {place.version}
                              <span>)</span>
                              {placeIndex === UI_CONSTANTS.MAX_VISIBLE_PLACES - 1 &&
                                placesData.hasMore && (
                                  <Button
                                    className={moreButton}
                                    color='primaryBrand'
                                    size='small'
                                    variant='text'
                                    onClick={() => {
                                      const allPlaces = getAllPlaces(placesData.places, update);
                                      setSelectedPlaces(allPlaces);
                                      setModalOpen(true);
                                    }}>
                                    {translate('RestartActivityCard.More', {
                                      count: (
                                        placesData.totalCount - UI_CONSTANTS.MAX_VISIBLE_PLACES
                                      ).toString(),
                                    })}
                                  </Button>
                                )}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {update.startTime
                          ? (() => {
                              const d = new Date(update.startTime);
                              const date = d.toLocaleDateString(
                                DATE_FORMAT_CONSTANTS.LOCALE,
                                DATE_FORMAT_CONSTANTS.DATE_OPTIONS,
                              );
                              const time = d.toLocaleTimeString(
                                DATE_FORMAT_CONSTANTS.LOCALE,
                                DATE_FORMAT_CONSTANTS.TIME_OPTIONS,
                              );
                              return translate('RestartActivityCard.DateAtTime', { date, time });
                            })()
                          : 'N/A'}
                      </TableCell>
                      <TableCell className={chevronColumn}>
                        <IconButton
                          onClick={() => toggleRowExpansion(update.id || '')}
                          className={chevronButton}
                          size='small'
                          aria-label={isExpanded ? 'Collapse row' : 'Expand row'}>
                          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className={expandedRow}>
                        <TableCell colSpan={4} className={expandedContent}>
                          <div className={expandedContentContainer}>
                            <RestartDetails update={update} className={detailCard} />
                            <RestartProgress update={update} className={detailCard} />
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
      <PlacesModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        places={selectedPlaces}
        title={translate('RestartActivityCard.PlacesAndVersionAtRestart')}
      />
    </div>
  );
};

export default RestartActivityCard;

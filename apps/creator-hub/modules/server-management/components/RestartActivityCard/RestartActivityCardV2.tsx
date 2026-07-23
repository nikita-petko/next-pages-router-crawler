import React, { useState, useEffect, useMemo } from 'react';
import type {
  ListRestartStatusesResponse,
  RestartStatus,
} from '@rbx/client-server-management-service/v1';
import { ProgressBar } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Card,
  Chip,
  Button,
  TablePagination,
} from '@rbx/ui';
import { UI_CONSTANTS, PAGINATION_CONSTANTS } from '../../constants';
import useServerManagementV2 from '../../hooks/useServerManagementV2';
import useUniversePlaces from '../../hooks/useUniversePlaces';
import {
  getStatusDisplay,
  getProgress,
  getPlacesList,
  getAllPlaces,
  formatStartTime,
  type RestartPlaceData,
} from '../../utils/RestartActivityUtils';
import PlacesModal from '../PlacesModal/PlacesModal';
import RestartProgressSheet from '../RestartProgressSheet/RestartProgressSheet';
import styles from './RestartActivityCardV2.module.css';

const HEADER_CELL = 'min-width-[150px] padding-y-medium padding-x-xlarge';
const BODY_CELL = 'min-width-[150px] padding-xlarge';

type RestartActivityCardV2Props = {
  className?: string;
};

const RestartActivityCardV2: React.FC<RestartActivityCardV2Props> = () => {
  const { handleListRestartStatuses } = useServerManagementV2();
  const { placesInfo } = useUniversePlaces();
  const { translate } = useTranslation();

  const [updateStatus, setUpdateStatus] = useState<ListRestartStatusesResponse | null>(null);
  const [placeModalOpen, setPlaceModalOpen] = useState(false);
  const [selectedPlaces, setSelectedPlaces] = useState<
    Array<{ id: number; name: string; version: string }>
  >([]);
  const [selectedUpdateIndex, setSelectedUpdateIndex] = useState(-1);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchUpdateStatus = async () => {
      try {
        const response = await handleListRestartStatuses();
        if (response) {
          setUpdateStatus((prevStatus) => {
            const prevEntries = prevStatus?.restartStatuses;
            const newEntries = response.restartStatuses;
            if (
              prevEntries &&
              newEntries &&
              Object.keys(prevEntries).length === Object.keys(newEntries).length &&
              JSON.stringify(prevEntries) === JSON.stringify(newEntries)
            ) {
              return prevStatus;
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
  }, [handleListRestartStatuses]);

  const getIndicatorClass = (phase: 'inProgress' | 'completed' | 'unknown') => {
    switch (phase) {
      case 'inProgress':
        return styles.statusIndicatorInProgress;
      case 'completed':
        return styles.statusIndicatorCompleted;
      default:
        return styles.statusIndicatorUnknown;
    }
  };

  const renderPlaceData = (placesData: RestartPlaceData, update: RestartStatus) => {
    const morePlacesButton = (
      <Button
        className={`padding-none ${styles.moreButton}`}
        color='primaryBrand'
        size='small'
        variant='text'
        onClick={() => {
          const allPlaces = getAllPlaces({
            update,
            places: placesData.visiblePlaces,
            placesInfo,
            translate,
          });
          setSelectedPlaces(allPlaces);
          setPlaceModalOpen(true);
        }}>
        {translate('RestartActivityCard.More', {
          count: (placesData.totalPlaces - UI_CONSTANTS.MAX_VISIBLE_PLACES).toString(),
        })}
      </Button>
    );

    const placesText =
      placesData.visiblePlaces.map((place) => place.name).join(', ') +
      (placesData.hasMore ? ',' : '');

    return (
      <div>
        <Typography variant='body2'>{placesText}</Typography>
        {placesData.hasMore && morePlacesButton}
      </div>
    );
  };

  const { paginatedUpdates, totalUpdates } = useMemo(() => {
    const entries = Object.entries(updateStatus?.restartStatuses ?? {});
    const updates = entries.map(([id, status]) => ({ id, ...status })).toReversed();
    const startIndex = page * rowsPerPage;
    return {
      paginatedUpdates: updates.slice(startIndex, startIndex + rowsPerPage),
      totalUpdates: updates.length,
    };
  }, [updateStatus?.restartStatuses, page, rowsPerPage]);

  if (totalUpdates === 0) {
    return (
      <div>
        <Card variant='outlined' className='margin-top-small text-align-x-center padding-large'>
          <Typography variant='body1' color='secondary'>
            {translate('RestartActivityCard.NoActiveOrRecentServerRestarts')}
          </Typography>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Card variant='outlined' className='margin-top-medium'>
        <div style={{ overflowX: 'auto' }}>
          <Table className={`width-full ${styles.tableElement}`}>
            <TableHead>
              <TableRow>
                <TableCell className={HEADER_CELL}>
                  {translate('RestartActivityCard.RestartStatus')}
                </TableCell>
                <TableCell className={HEADER_CELL}>
                  {translate('RestartActivityCard.Places')}
                </TableCell>
                <TableCell className={HEADER_CELL}>
                  {translate('RestartActivityCard.StartTime')}
                </TableCell>
                <TableCell className={HEADER_CELL}>
                  {translate('RestartActivityCard.Progress')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedUpdates.map((update: RestartStatus & { id: string }, index: number) => {
                const statusDisplay = getStatusDisplay({
                  update,
                  translate,
                  getIndicatorClass,
                });
                const placesData = getPlacesList({ update, placesInfo, translate });
                const progress = getProgress(update);

                return (
                  <TableRow
                    key={update.id}
                    hover
                    className='cursor-pointer'
                    onClick={() => setSelectedUpdateIndex(index)}>
                    <TableCell className='min-width-[150px] padding-large'>
                      <Chip
                        label={statusDisplay.text}
                        className='inline-flex items-center gap-small radius-small min-width-0 padding-x-small'
                        icon={
                          <div
                            className={`size-200 radius-circle ${statusDisplay.indicatorClass}`}
                          />
                        }
                        color='secondary'
                        size='small'
                      />
                    </TableCell>
                    <TableCell className={BODY_CELL}>
                      {renderPlaceData(placesData, update)}
                    </TableCell>
                    <TableCell className={BODY_CELL}>
                      {formatStartTime(update.startTime, translate)}
                    </TableCell>
                    <TableCell className={BODY_CELL}>
                      <div className='flex gap-small items-center'>
                        <ProgressBar ariaLabel={`restartProgress: ${progress}%`} value={progress} />
                        <Typography variant='smallLabel1'>{`${progress.toFixed(1)}%`}</Typography>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
      <div className='flex justify-end items-center padding-top-small'>
        <TablePagination
          page={page}
          rowsPerPageOptions={PAGINATION_CONSTANTS.ROWS_PER_PAGE_OPTIONS}
          count={totalUpdates}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </div>
      <PlacesModal
        open={placeModalOpen}
        onClose={() => setPlaceModalOpen(false)}
        places={selectedPlaces}
        title={translate('RestartActivityCard.PlacesAndVersionAtRestart')}
      />
      <RestartProgressSheet
        onOpenChange={(open) => {
          if (!open) {
            setSelectedUpdateIndex(-1);
          }
        }}
        update={selectedUpdateIndex >= 0 ? paginatedUpdates[selectedUpdateIndex] : {}}
        open={selectedUpdateIndex >= 0}
      />
    </div>
  );
};

export default RestartActivityCardV2;

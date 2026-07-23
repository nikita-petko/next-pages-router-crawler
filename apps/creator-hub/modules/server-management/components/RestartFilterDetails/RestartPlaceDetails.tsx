import React, { FunctionComponent, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Card, Grid, ListItemText, Typography } from '@rbx/ui';
import { Badge, IconButton, Divider } from '@rbx/foundation-ui';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { RestartStatus } from '@rbx/clients/serverManagementService';
import { getAllPlaces, getPlacesList } from '../../utils/RestartActivityUtils';
import useUniversePlaces from '../../hooks/useUniversePlaces';
import useRestartFilterDetailsStyles from './RestartFilterDetails.styles';

export interface RestartFilterDetailsProps {
  update: RestartStatus;
}

const RestartPlaceDetails: FunctionComponent<RestartFilterDetailsProps> = ({ update }) => {
  const { translate } = useTranslation();
  const { placesInfo } = useUniversePlaces();
  const { classes } = useRestartFilterDetailsStyles();

  const { placeHeader, placesContainer, placeIcon } = classes;

  const [expandedPlaces, setExpandedPlaces] = useState<number[]>([]);

  const placesList = useMemo(() => {
    const placeData = getPlacesList({ update, placesInfo, translate });
    return getAllPlaces({ update, places: placeData.visiblePlaces, placesInfo, translate });
  }, [update, placesInfo, translate]);

  return (
    <div>
      <Typography variant='h6'>{translate('RestartFilterDetails.FilterInfo')}</Typography>
      {placesList.map((place, index) => (
        <div key={place.id} className={placesContainer}>
          <div className={placeHeader}>
            <div className={placeIcon}>
              <Thumbnail2d
                targetId={place.id}
                type={ThumbnailTypes.placeIcon}
                alt={place.name}
                returnPolicy={ReturnPolicy.PlaceHolder}
              />
            </div>
            <ListItemText
              primary={place.name}
              secondary={translate('RestartFilterDetails.PlaceId', {
                placeId: place.id.toString(),
              })}
            />
            <IconButton
              icon={
                expandedPlaces.includes(place.id)
                  ? 'icon-regular-chevron-small-up'
                  : 'icon-regular-chevron-small-down'
              }
              variant='Utility'
              size='Small'
              ariaLabel='expand places'
              onClick={() =>
                setExpandedPlaces((prev) =>
                  prev.includes(place.id)
                    ? prev.filter((id) => id !== place.id)
                    : [...prev, place.id],
                )
              }
            />
          </div>
          {expandedPlaces.includes(place.id) &&
            (() => {
              const placeStatus = update.placeRestartStatuses?.[place.id.toString()];
              const restartFilter = placeStatus?.filter;

              if (restartFilter?.versions) {
                return (
                  <Card variant='outlined'>
                    <Grid container className='flex flex-col gap-small padding-medium'>
                      <Grid item>
                        <Typography variant='captionHeader'>
                          {translate('RestartFilterDetails.Versions')}
                        </Typography>
                      </Grid>
                      <Grid item className='flex wrap gap-small'>
                        {restartFilter.versions.map((version) => (
                          <Badge key={version} label={`v${version}`} variant='Neutral' />
                        ))}
                      </Grid>
                    </Grid>
                  </Card>
                );
              }

              return (
                <Card variant='outlined'>
                  <Grid container className='flex items-center justify-between padding-small'>
                    <Grid item>
                      <Typography variant='captionHeader'>
                        {translate('RestartFilterDetails.Versions')}
                      </Typography>
                    </Grid>
                    <Grid item>
                      <Typography variant='caption'>
                        {restartFilter?.excludeCurrentVersion
                          ? translate('RestartFilterDetails.Versions.AllOutdated')
                          : translate('RestartFilterDetails.Versions.All')}
                      </Typography>
                    </Grid>
                  </Grid>
                </Card>
              );
            })()}
          {index !== placesList.length - 1 && <Divider />}
        </div>
      ))}
    </div>
  );
};

export default RestartPlaceDetails;

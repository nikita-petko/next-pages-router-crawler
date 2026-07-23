import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, Select, MenuItem, Checkbox } from '@rbx/ui';
import useMatchmakingContainerStyles from '../container/MatchmakingContainer.styles';
import useUniversePlaces from '../hooks/useUniversePlaces';
import type { PlaceInfo } from '../types/PlaceInfo';
import PlacesChip from './PlacesChip';

export interface PlacesChipSelectProps {
  showOptional: boolean;
  disabled: boolean;
  appliedPlaces?: PlaceInfo[];
  onSelectedPlacesChange: (places: PlaceInfo[]) => void;
}

const PlacesChipSelect: FunctionComponent<React.PropsWithChildren<PlacesChipSelectProps>> = ({
  showOptional,
  disabled,
  appliedPlaces,
  onSelectedPlacesChange,
}) => {
  const { placesInfo } = useUniversePlaces();
  const {
    classes: { image, menuItem, placeName },
  } = useMatchmakingContainerStyles();

  const { translate } = useTranslation();

  const handleSelectChanges = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const values = `${e?.target?.value}`;
      const selectedPlaceIds = new Set(
        values.split(',').map((placeIdString) => Number(placeIdString)),
      );
      if (selectedPlaceIds.size > 0) {
        const currSelectedPlaces: PlaceInfo[] = [];
        selectedPlaceIds.forEach((id) => {
          const selectedPlace = placesInfo.find((placeInfo) => placeInfo.placeId === id);
          if (selectedPlace) {
            currSelectedPlaces.push(selectedPlace);
          }
        });
        // setSelectedPlaces(currSelectedPlaces);
        onSelectedPlacesChange(currSelectedPlaces);
      }
    },
    [onSelectedPlacesChange, placesInfo],
  );

  return (
    <Select
      multiple
      value={appliedPlaces?.map((places) => places.placeId)}
      label={translate('Label.SelectPlaces')}
      helperText={showOptional ? translate('Helper.Optional') : null}
      fullWidth
      disabled={disabled}
      onChange={handleSelectChanges}
      renderValue={() => (
        <Grid sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {appliedPlaces?.map((place) => (
            <PlacesChip key={place.placeId} place={place} />
          ))}
        </Grid>
      )}>
      {placesInfo.map((place) => (
        <MenuItem className={menuItem} key={place?.placeId} value={place?.placeId ?? ''}>
          <Grid container direction='row' justifyContent='flex-start'>
            <Checkbox
              style={{ top: -5 }}
              checked={!!appliedPlaces?.find((currPlace) => currPlace.placeId === place?.placeId)}
            />
            <img className={image} src={place?.thumbnailUrl} alt={place?.name ?? ''} />
            <Grid className={placeName}>{place?.name}</Grid>
          </Grid>
        </MenuItem>
      ))}
    </Select>
  );
};

export default PlacesChipSelect;

import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import { Chip } from '@rbx/ui';
import useMatchmakingContainerStyles from '../container/MatchmakingContainer.styles';
import type { PlaceInfo } from '../types/PlaceInfo';

export interface PlacesChipProps {
  place: PlaceInfo;
  onDelete?: (placeId: number) => void;
}

const PlacesChip: FunctionComponent<React.PropsWithChildren<PlacesChipProps>> = ({
  place,
  onDelete,
}) => {
  const {
    classes: { chipImage },
  } = useMatchmakingContainerStyles();

  const handleDelete = useCallback(() => {
    if (onDelete && place?.placeId) {
      onDelete(place?.placeId);
    }
  }, [onDelete, place?.placeId]);

  const content =
    onDelete === undefined ? (
      <Chip
        key={place.placeId}
        color='secondary'
        label={place?.name}
        icon={<img className={chipImage} src={place?.thumbnailUrl} alt={place?.name ?? ''} />}
      />
    ) : (
      <Chip
        key={place.placeId}
        onDelete={handleDelete}
        color='secondary'
        label={place?.name}
        icon={<img className={chipImage} src={place?.thumbnailUrl} alt={place?.name ?? ''} />}
      />
    );

  return content;
};

export default PlacesChip;

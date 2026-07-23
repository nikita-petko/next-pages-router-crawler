import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@rbx/ui';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { useTranslation } from '@rbx/intl';
import usePlacesModalStyles from './PlacesModal.styles';
import { UI_CONSTANTS } from '../../constants';

type Place = {
  id: number;
  name: string;
  version: number | string;
  thumbnail?: string;
};

type PlacesModalProps = {
  open: boolean;
  onClose: () => void;
  places: Place[];
  title?: string;
};

const PlacesModal: React.FC<PlacesModalProps> = ({ open, onClose, places, title }) => {
  const { classes } = usePlacesModalStyles();
  const {
    modalContainer,
    modalTitle,
    dialogContent,
    placesList,
    placeItem,
    placeAvatar,
    placeInfo,
    placeName,
    placeVersion,
    dialogActions,
  } = classes;
  const { translate } = useTranslation();
  const [displayedPlaces, setDisplayedPlaces] = useState<Place[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPlaceRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      setDisplayedPlaces(places.slice(0, UI_CONSTANTS.ITEMS_PER_PAGE));
      setPage(1);
      setHasMore(places.length > UI_CONSTANTS.ITEMS_PER_PAGE);
    }
  }, [open, places]);

  const loadMorePlaces = useCallback(() => {
    const nextPage = page + 1;
    const startIndex = (nextPage - 1) * UI_CONSTANTS.ITEMS_PER_PAGE;
    const endIndex = startIndex + UI_CONSTANTS.ITEMS_PER_PAGE;
    const newPlaces = places.slice(startIndex, endIndex);

    if (newPlaces.length > 0) {
      setDisplayedPlaces((prev) => [...prev, ...newPlaces]);
      setPage(nextPage);
      setHasMore(endIndex < places.length);
    } else {
      setHasMore(false);
    }
  }, [page, places]);

  const lastPlaceCallback = useCallback(
    (node: HTMLDivElement) => {
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMorePlaces();
        }
      });

      if (node) observer.current.observe(node);
      lastPlaceRef.current = node;
    },
    [hasMore, loadMorePlaces],
  );

  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  return (
    <Dialog open={open} onClose={onClose} maxWidth={false}>
      <div className={modalContainer}>
        <DialogTitle className={modalTitle}>
          {title || translate('RestartActivityCard.PlacesAndVersionAtRestart')}
        </DialogTitle>
        <DialogContent className={dialogContent}>
          <div className={placesList}>
            {displayedPlaces.map((place, index) => (
              <div
                key={`${place.id}-${place.version}`}
                className={placeItem}
                ref={index === displayedPlaces.length - 1 ? lastPlaceCallback : undefined}>
                <div className={placeAvatar}>
                  <Thumbnail2d
                    targetId={place.id}
                    type={ThumbnailTypes.placeIcon}
                    alt={place.name}
                    returnPolicy={ReturnPolicy.PlaceHolder}
                  />
                </div>
                <div className={placeInfo}>
                  <Typography variant='h6' className={placeName}>
                    {place.name}
                  </Typography>
                  <Typography variant='body2' color='secondary' className={placeVersion}>
                    v{place.version}
                  </Typography>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
        <DialogActions className={dialogActions}>
          <Button onClick={onClose} variant='contained' color='primaryBrand'>
            {translate('Button.Close')}
          </Button>
        </DialogActions>
      </div>
    </Dialog>
  );
};

export default PlacesModal;

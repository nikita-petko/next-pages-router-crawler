import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  V1UniversesUniverseIdPlacesGetLimitEnum,
  V1UniversesUniverseIdPlacesGetSortOrderEnum,
} from '@rbx/client-develop/v1';
import { ReturnPolicy, Thumbnail2d, ThumbnailClient, ThumbnailTypes } from '@rbx/thumbnails';
import developClient from '@modules/clients/develop';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import type { PlaceInfo } from '../types/PlaceInfo';
import type { Place } from '../utils/PlaceUtils';
import { isValidPlace } from '../utils/PlaceUtils';
import placesInfoContext from './UniversePlacesContext';

const UniversePlacesProvider: FunctionComponent<React.PropsWithChildren> = ({ children }) => {
  const { error } = useMetricsMonitoring();
  const { gameDetails } = useCurrentGame();
  const [placesInfo, setPlacesInfo] = useState<PlaceInfo[]>([]);
  const [isPlacesLoading, setIsPlacesLoading] = useState<boolean>(true);
  const [getPlacesError, setGetPlacesError] = useState<Error | null>(null);

  const universeId = useMemo(() => {
    return gameDetails?.id;
  }, [gameDetails]);

  const getPlaceInfo = async (place: Place): Promise<PlaceInfo> => {
    const { imageUrl } = await ThumbnailClient.getThumbnailImage(
      ThumbnailTypes.placeIcon,
      place.id,
      ReturnPolicy.PlaceHolder,
    );
    return {
      name: place.name,
      placeId: place.id,
      thumbnailUrl: imageUrl,
      thumbnail: (
        <Thumbnail2d
          targetId={place.id}
          type={ThumbnailTypes.placeIcon}
          alt={place.name}
          returnPolicy={ReturnPolicy.PlaceHolder}
        />
      ),
    };
  };

  const getPlacesInfo = useCallback(async () => {
    const recursivelyGetPlaces = async (cursor: string | undefined) => {
      if (typeof cursor === 'undefined') {
        setIsPlacesLoading(false);
        setGetPlacesError(null);
        return;
      }
      setIsPlacesLoading(true);
      try {
        const { nextPageCursor, data: placesData } = await developClient.getPlacesOfUniverse(
          universeId!,
          V1UniversesUniverseIdPlacesGetSortOrderEnum.Asc,
          V1UniversesUniverseIdPlacesGetLimitEnum.NUMBER_100,
          cursor ?? '',
        );
        if (placesData) {
          const filteredResults = placesData?.filter(
            (place) => isValidPlace(place) && place.id !== 0,
          ) as Place[];
          const formattedPlaceInfo: PlaceInfo[] = await Promise.all(
            filteredResults?.map((place) => getPlaceInfo(place)),
          );
          setPlacesInfo((prevList) => [...prevList, ...formattedPlaceInfo]);
          recursivelyGetPlaces(nextPageCursor);
        } else {
          recursivelyGetPlaces(undefined);
        }
      } catch (e) {
        const catchedError = e as Error;
        error(catchedError.message);
        setGetPlacesError(catchedError);
        setIsPlacesLoading(false);
      }
    };
    recursivelyGetPlaces('');
  }, [error, universeId]);

  useEffect(() => {
    if (!universeId) {
      return;
    }
    getPlacesInfo();
  }, [getPlacesInfo, universeId]);

  const providerValue = useMemo(() => {
    return { universeId, placesInfo, isPlacesLoading, getPlacesError };
  }, [getPlacesError, isPlacesLoading, placesInfo, universeId]);

  return <placesInfoContext.Provider value={providerValue}>{children}</placesInfoContext.Provider>;
};

export default UniversePlacesProvider;

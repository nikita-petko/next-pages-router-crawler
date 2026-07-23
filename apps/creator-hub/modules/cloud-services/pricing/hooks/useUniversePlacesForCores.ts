import { useCallback, useEffect, useState } from 'react';
import {
  V1UniversesUniverseIdPlacesGetLimitEnum,
  V1UniversesUniverseIdPlacesGetSortOrderEnum,
} from '@rbx/client-develop/v1';
import developClient from '@modules/clients/develop';
import { isValidPlace, type Place } from '@modules/server-management/utils/PlaceUtils';
import { isValidPlaceId } from '../utils/coresValidation';

export type CorePlace = {
  placeId: number;
  name: string;
};

export type UseUniversePlacesForCoresResult = {
  places: CorePlace[];
  isLoading: boolean;
};

export function useUniversePlacesForCores(
  universeId: number | undefined,
): UseUniversePlacesForCoresResult {
  const [places, setPlaces] = useState<CorePlace[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchAllPlaces = useCallback(async (id: number) => {
    setIsLoading(true);
    const accumulated: CorePlace[] = [];
    let cursor: string | undefined = '';
    try {
      while (typeof cursor === 'string') {
        const { nextPageCursor, data } = await developClient.getPlacesOfUniverse(
          id,
          V1UniversesUniverseIdPlacesGetSortOrderEnum.Asc,
          V1UniversesUniverseIdPlacesGetLimitEnum.NUMBER_100,
          cursor,
        );
        if (data) {
          data
            .filter((place): place is Place => isValidPlace(place) && isValidPlaceId(place.id))
            .forEach((place) => {
              accumulated.push({ placeId: place.id, name: place.name ?? String(place.id) });
            });
        }
        cursor = nextPageCursor ?? undefined;
      }
      setPlaces(accumulated);
    } catch {
      setPlaces([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof universeId !== 'number') {
      setPlaces([]);
      setIsLoading(false);
      return;
    }
    void fetchAllPlaces(universeId);
  }, [fetchAllPlaces, universeId]);

  return { places, isLoading };
}

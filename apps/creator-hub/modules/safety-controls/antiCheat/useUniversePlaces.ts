import { skipToken, useQuery } from '@tanstack/react-query';
import {
  V1UniversesUniverseIdPlacesGetLimitEnum,
  V1UniversesUniverseIdPlacesGetSortOrderEnum,
} from '@rbx/client-develop/v1';
import developClient from '@modules/clients/develop';
import { isValidPlace } from '@modules/server-management/utils/PlaceUtils';

export type AntiCheatPlace = {
  placeId: number;
  name: string;
};

export const getUniversePlacesQueryKey = (universeId: number) =>
  ['universePlaces', universeId] as const;

// Pages through every place in the universe. Most experiences have far fewer than one
// page (100) of places; recursion (rather than a while-loop) mirrors the existing
// UniversePlacesProvider and avoids awaiting inside a loop.
const fetchPlacesPage = async (
  universeId: number,
  cursor: string,
  accumulated: AntiCheatPlace[],
): Promise<AntiCheatPlace[]> => {
  const { data, nextPageCursor } = await developClient.getPlacesOfUniverse(
    universeId,
    V1UniversesUniverseIdPlacesGetSortOrderEnum.Asc,
    V1UniversesUniverseIdPlacesGetLimitEnum.NUMBER_100,
    cursor,
  );

  const places = [...accumulated];
  (data ?? []).forEach((place) => {
    if (isValidPlace(place) && place.id !== 0) {
      places.push({ placeId: place.id, name: place.name });
    }
  });

  return nextPageCursor ? fetchPlacesPage(universeId, nextPageCursor, places) : places;
};

export const useUniversePlacesQuery = (universeId: number | undefined) =>
  useQuery({
    queryKey: getUniversePlacesQueryKey(universeId ?? 0),
    queryFn: universeId === undefined ? skipToken : () => fetchPlacesPage(universeId, '', []),
  });

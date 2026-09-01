import { useQuery } from '@tanstack/react-query';
import type { RobloxGamesApiModelsResponsePlaceDetails } from '@rbx/client-games/v1';
import gamesClient from '@modules/clients/games';

export const multigetPlaceDetailsKey = 'gamesClient/multigetPlaceDetails';

export const useMultigetPlaceDetails = (placeIds: string[]) => {
  // Filter out empty strings and convert to numbers
  const validPlaceIds = placeIds
    .filter((id) => id)
    .map((id) => parseInt(id, 10))
    .filter((id) => !Number.isNaN(id) && id > 0);

  const response = useQuery({
    queryKey: [multigetPlaceDetailsKey, validPlaceIds],
    queryFn: async () => {
      return gamesClient.multigetPlaceDetails(validPlaceIds);
    },
    enabled: validPlaceIds.length > 0,
  });

  const placeToGameDetailsMap = new Map<string, RobloxGamesApiModelsResponsePlaceDetails>();
  if (response.data && Array.isArray(response.data)) {
    response.data.forEach((place) => {
      if (place.universeRootPlaceId) {
        placeToGameDetailsMap.set(place.universeRootPlaceId.toString(), place);
      }
    });
  }

  return {
    placeDetails: response.data || [],
    placeToGameDetailsMap,
    ...response,
  };
};

export default useMultigetPlaceDetails;

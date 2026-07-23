import adsClient from '@clients/ads';
import { ListPlacesResponse } from '@type/place';

export const listPlaces = async (universeId: number): Promise<ListPlacesResponse> => {
  const response = await adsClient.get<ListPlacesResponse>({
    url: `/v3/native/universes/${universeId}/places`,
  });
  return response.data;
};

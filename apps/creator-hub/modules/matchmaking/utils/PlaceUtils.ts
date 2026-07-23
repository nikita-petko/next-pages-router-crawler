import { RobloxApiDevelopModelsPlaceModel } from '@rbx/clients/develop';

export type Place = Required<Omit<RobloxApiDevelopModelsPlaceModel, 'universeId'>> &
  Pick<RobloxApiDevelopModelsPlaceModel, 'universeId'>;
export const isValidPlace = (obj: unknown): obj is Place => {
  const place = obj as Place;
  return place.id !== undefined && place.name !== undefined && place.description !== undefined;
};

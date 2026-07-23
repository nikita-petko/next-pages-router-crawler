import {
  defaultAdvertisedUniverse,
  PUBLIC_UNIVERSE_PRIVACY_TYPE,
} from '@constants/universeConstants';
import { AdvertisedUniverse, UniverseShapeType } from '@type/universe';

const getOwnedUniverseIdsFromPickerOptions = (universes: AdvertisedUniverse[]): number[] =>
  universes.filter((universe) => universe.universe_id !== 0).map((u) => u.universe_id);

export const resolveUniverseIdsForDateFilter = (
  universe: AdvertisedUniverse,
  pickerUniverses: AdvertisedUniverse[],
): number[] => {
  if (universe.universe_id === 0) {
    return getOwnedUniverseIdsFromPickerOptions(pickerUniverses);
  }
  return [universe.universe_id];
};

const findUniverseInPickerOptions = (
  universes: AdvertisedUniverse[],
  universeId: number,
): AdvertisedUniverse | undefined =>
  universes.find((universe) => universe.universe_id === universeId);

export const resolveInitialUniverseFilter = (
  universes: AdvertisedUniverse[],
  initialUniverseId?: number,
): AdvertisedUniverse => {
  if (initialUniverseId === undefined) {
    return universes[0] ?? defaultAdvertisedUniverse;
  }
  return (
    findUniverseInPickerOptions(universes, initialUniverseId) ??
    universes[0] ??
    defaultAdvertisedUniverse
  );
};

export const buildPickerUniversesWithAllOption = (
  universes: AdvertisedUniverse[],
): AdvertisedUniverse[] => {
  if (universes.length > 1) {
    return [defaultAdvertisedUniverse, ...universes];
  }
  return universes;
};

export const mapAdvertisedUniverseToUniverseShape = (
  universe: AdvertisedUniverse,
): UniverseShapeType => ({
  privacy_type: PUBLIC_UNIVERSE_PRIVACY_TYPE,
  root_place_id: 0,
  universe_id: universe.universe_id,
  universe_name: universe.universe_name,
});

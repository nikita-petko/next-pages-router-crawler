import type { UniverseSessionPlace } from '@modules/clients/analytics/universeSessionMetadataApi';
import sortPlaceVersionFilterOptionsDescending from '@modules/experience-analytics-shared/utils/sortPlaceVersionFilterOptionsDescending';

export const indexSessionPlacesById = (
  places: readonly UniverseSessionPlace[],
): ReadonlyMap<string, UniverseSessionPlace> =>
  new Map(places.map((place) => [place.placeId, place]));

export const getSelectedPlaceVersionOptions = (
  places: readonly UniverseSessionPlace[],
  selectedPlaceIds: readonly string[] | undefined,
): string[] => {
  if (selectedPlaceIds === undefined || selectedPlaceIds.length === 0) {
    return [];
  }

  const selectedPlaceIdSet = new Set(selectedPlaceIds);
  const versions = new Set<number>();
  places.forEach((place) => {
    if (selectedPlaceIdSet.has(place.placeId)) {
      place.versions.forEach((version) => {
        if (Number.isInteger(version)) {
          versions.add(version);
        }
      });
    }
  });

  return sortPlaceVersionFilterOptionsDescending([...versions].map(String));
};

export const prunePlaceVersions = (
  selectedVersions: readonly number[] | undefined,
  allowedVersionOptions: readonly string[],
): number[] => {
  if (selectedVersions === undefined || selectedVersions.length === 0) {
    return [];
  }

  const allowedVersionSet = new Set(allowedVersionOptions);
  return selectedVersions.filter((version) => allowedVersionSet.has(String(version)));
};

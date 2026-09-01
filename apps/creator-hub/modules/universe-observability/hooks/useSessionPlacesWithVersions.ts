import { useQuery } from '@tanstack/react-query';
import type { UniverseSessionPlace } from '@modules/clients/analytics/universeSessionMetadataApi';
import { useUniverseSessionMetadataClient } from '../components/UniverseSessionMetadataClientProvider';
import { indexSessionPlacesById } from '../utils/sessionBrowserPlaceFilterOptions';

export const getSessionPlacesWithVersionsQueryKey = (universeId: number | undefined) =>
  ['universe-observability', 'session-places-with-versions', { universeId }] as const;

export type SessionPlacesWithVersions = {
  readonly places: readonly UniverseSessionPlace[];
  readonly placesById: ReadonlyMap<string, UniverseSessionPlace>;
};

export const EMPTY_SESSION_PLACES: SessionPlacesWithVersions = {
  places: [],
  placesById: new Map(),
};

// Module scope keeps the reference stable so react-query reuses the derived map
// instead of rebuilding it on every render.
const toSessionPlacesWithVersions = (
  places: readonly UniverseSessionPlace[],
): SessionPlacesWithVersions => ({
  places,
  placesById: indexSessionPlacesById(places),
});

const useSessionPlacesWithVersions = (universeId: number | undefined) => {
  const client = useUniverseSessionMetadataClient();

  return useQuery({
    queryKey: getSessionPlacesWithVersionsQueryKey(universeId),
    queryFn: async ({ signal }) => {
      if (!universeId) {
        throw new Error('A universe ID is required to load session places.');
      }

      return client.getSessionPlacesWithVersions(universeId, signal);
    },
    enabled: universeId != null && universeId > 0,
    select: toSessionPlacesWithVersions,
  });
};

export default useSessionPlacesWithVersions;

import { ReleaseStatus } from '@rbx/clients/experienceReleases';
import {
  canSetExperienceReleaseStatus,
  getExperienceReleaseStatus,
} from '@modules/clients/experienceReleasesRequests';
import { useQuery } from '@tanstack/react-query';

// Shared query key function
export const getExperienceReleaseStatusQueryKeys = (universeId: number) => [
  ['experienceReleaseStatus', universeId],
  ['canSetReleaseStatus', universeId],
];

export function useCanSetExperienceReleasesQuery(universeId: number, enabled: boolean = false) {
  return useQuery({
    queryKey: ['canSetReleaseStatus', universeId],
    queryFn: () => {
      return canSetExperienceReleaseStatus({
        universeId,
        releaseStatus: ReleaseStatus.Beta,
      });
    },
    enabled: enabled && !!universeId,
  });
}

export function useGetExperienceReleaseStatusQuery(universeId: number, enabled: boolean = false) {
  return useQuery({
    queryKey: ['experienceReleaseStatus', universeId],
    queryFn: () => {
      return getExperienceReleaseStatus({
        universeId,
      });
    },
    enabled: enabled && !!universeId,
  });
}

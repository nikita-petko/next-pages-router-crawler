import { useQuery } from '@tanstack/react-query';
import { ReleaseStatus } from '@rbx/client-experience-releases-api/v1';
import {
  canSetExperienceReleaseStatus,
  getExperienceReleaseStatus,
} from '@modules/clients/experienceReleasesRequests';

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

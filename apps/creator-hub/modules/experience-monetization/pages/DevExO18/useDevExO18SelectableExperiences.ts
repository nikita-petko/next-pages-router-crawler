import { useQuery } from '@tanstack/react-query';
import type { ResolvedUniversePermissionsResponse } from '@rbx/client-organizations-service-api/v1';
import { SearchCreatorType } from '@rbx/client-universes-api/v1';
import { useAuthentication } from '@modules/authentication/providers';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import type CreationData from '@modules/creations/common/interfaces/CreationData';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { useGroups } from '@modules/providers/groups/GroupsProvider';
import { getUniversePermissions } from '@modules/react-query/organizations/organizationsRequest';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import {
  canAccessDevExO18LandingPage,
  type DevExO18ExperienceOption,
} from './utils/devExO18PageAccess';
import loadAllMyExperiences from './utils/loadAllMyExperiences';

const STALE_TIME_MS = 5 * 60 * 1000;

export const devExO18SelectableExperiencesQueryKey = (
  creatorType: SearchCreatorType,
  creatorTargetId: number | undefined,
  enableAudiencesReplacement: boolean,
) =>
  [
    'devExO18SelectableExperiences',
    creatorType,
    creatorTargetId,
    enableAudiencesReplacement,
  ] as const;

async function toSelectableOptions(
  experiences: CreationData[],
): Promise<DevExO18ExperienceOption[]> {
  const permissionResults = await Promise.all(
    experiences.map(async (experience) => {
      const universeId = experience.universeId;
      if (universeId == null || experience.name == null) {
        return null;
      }

      let permissions: ResolvedUniversePermissionsResponse | undefined;
      try {
        permissions = await getUniversePermissions(universeId);
      } catch {
        return null;
      }

      if (!canAccessDevExO18LandingPage(permissions)) {
        return null;
      }

      return {
        universeId,
        name: experience.name,
      };
    }),
  );

  return permissionResults.filter((option): option is DevExO18ExperienceOption => option != null);
}

function useDevExO18SelectableExperiences(isEnabled = true) {
  const { user } = useAuthentication();
  const { currentGroup, isFetched: isGroupsFetched } = useGroups();
  const { settings } = useSettings();
  const userId = user?.id;
  const currentGroupId = currentGroup?.id;
  const creatorType = currentGroupId != null ? SearchCreatorType.Group : SearchCreatorType.User;
  const creatorTargetId = currentGroupId ?? userId;
  const { isFetched: isIxpFetched, params: ixpParams } = useIXPParameters(
    IXPLayers.CreatorHubCreationsPermission,
  );
  const enableAudiencesReplacement = ixpParams.enableAudiencesReplacement ?? false;

  return useQuery({
    queryKey: devExO18SelectableExperiencesQueryKey(
      creatorType,
      creatorTargetId,
      enableAudiencesReplacement,
    ),
    queryFn: async () => {
      if (creatorTargetId == null) {
        return [];
      }
      const experiences = await loadAllMyExperiences(
        creatorType,
        creatorTargetId,
        settings,
        enableAudiencesReplacement,
      );
      return toSelectableOptions(experiences);
    },
    enabled: isEnabled && creatorTargetId != null && isGroupsFetched && isIxpFetched,
    staleTime: STALE_TIME_MS,
  });
}

export default useDevExO18SelectableExperiences;

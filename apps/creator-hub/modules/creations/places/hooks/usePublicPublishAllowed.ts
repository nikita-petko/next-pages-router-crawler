import { useMemo } from 'react';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { CreatorType } from '@modules/miscellaneous/common';
import useIXPParameters from '@modules/miscellaneous/hooks/useIXPParameters';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import {
  useGetActivationEligibilityForUniverse,
  useGetUniverseConfiguration,
} from '@modules/react-query/develop';
import { hasPlayableAudience } from '../../common/audiences';

/**
 * Hook to determine if public publish is allowed for an experience.
 * This checks if the user is eligible to public publish and hasn't exceeded their limit.
 *
 * @returns An object containing:
 *   - isPublicPublishAllowed: true if public publish is allowed, false otherwise
 *   - isPublicExperience: true if the experience is public or shared with community
 */
const usePublicPublishAllowed = (): {
  isPublicPublishAllowed: boolean;
  isPublicExperience: boolean;
} => {
  const { gameDetails } = useCurrentGame();
  const universeId = gameDetails?.id;
  const isUserOwned = gameDetails?.creator?.type === CreatorType.User;

  const { data: universeConfiguration } = useGetUniverseConfiguration(universeId);

  const { data: activationEligibility } = useGetActivationEligibilityForUniverse(universeId);

  const {
    params: { enableAudiencesReplacement },
  } = useIXPParameters(IXPLayers.CreatorHubCreationsPermission);

  const isPublicExperience = useMemo(() => {
    if (!universeConfiguration) {
      return false;
    }
    if (enableAudiencesReplacement === true && universeConfiguration.audiences !== undefined) {
      return hasPlayableAudience(universeConfiguration.audiences);
    }
    // A "public experience" is one that is public or shared with community
    // Both have privacyType === 'Public' (PublicConnections also has privacyType === 'Public')
    // Exclude user-owned experiences with isFriendsOnly === true
    if (
      isUserOwned &&
      universeConfiguration.privacyType === 'Public' &&
      universeConfiguration.isFriendsOnly === true
    ) {
      return false;
    }
    return universeConfiguration.privacyType === 'Public';
  }, [universeConfiguration, isUserOwned, enableAudiencesReplacement]);

  const isPublicPublishAllowed = useMemo(() => {
    if (!activationEligibility) {
      return true;
    }
    if (!activationEligibility.isEligible) {
      return false;
    }
    if (
      !activationEligibility.isPublishToExistingUniverse &&
      (activationEligibility.remainingPublicPublishCount ?? 1) <= 0
    ) {
      return false;
    }

    return true;
  }, [activationEligibility]);

  return { isPublicPublishAllowed, isPublicExperience };
};

export default usePublicPublishAllowed;

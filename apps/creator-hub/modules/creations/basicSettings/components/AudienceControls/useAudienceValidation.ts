import { useMemo } from 'react';
import { useContentRatingDetails } from '@modules/audience-reach/hooks/useContentRatingDetails';
import { useUniverseCreatorEligibility } from '@modules/audience-reach/hooks/useUniverseCreatorEligibility';
import { useUniversePublishEligibility } from '@modules/audience-reach/hooks/useUniversePublishEligibility';
import {
  CreatorHubCreationsPermissionParameters,
  IXPLayers,
} from '@modules/clients/ixpExperiments';
import useIXPParameters from '@modules/miscellaneous/hooks/useIXPParameters';
import { useCreatorEligibility } from '@modules/publishing-permissions/hooks/useCreatorEligibility';
import { Audience } from '../ConfigureExperienceTypes';
import type { AudienceValidationState } from './audienceValidation';
import { getAudienceValidationState } from './audienceValidation';

export type UseAudienceValidationOptions = {
  universeId: number;
  audiences: Audience[] | undefined;
  enabled: boolean;
  // True when paid access (Robux/Fiat) is enabled on the experience and
  // therefore the audience is locked to Public.
  isPublicConnectionsDisabled: boolean;
};

export type UseAudienceValidationResult = {
  state: AudienceValidationState;
  isLoading: boolean;
  isError: boolean;
};

const NoneState: AudienceValidationState = { type: 'none' };

export const useAudienceValidation = (
  options: UseAudienceValidationOptions,
): UseAudienceValidationResult => {
  const { universeId, audiences, enabled, isPublicConnectionsDisabled } = options;
  const queryUniverseId = enabled ? universeId : 0;

  const {
    data: universeCreatorData,
    isLoading: isUniverseCreatorLoading,
    isError: isUniverseCreatorError,
  } = useUniverseCreatorEligibility(queryUniverseId);

  const {
    data: creatorData,
    isLoading: isCreatorLoading,
    isError: isCreatorError,
  } = useCreatorEligibility();

  const {
    data: universeEligibility,
    isLoading: isPublishEligibilityLoading,
    isError: isPublishEligibilityError,
  } = useUniversePublishEligibility(queryUniverseId);

  const {
    data: contentRating,
    isLoading: isContentRatingLoading,
    isError: isContentRatingError,
  } = useContentRatingDetails(queryUniverseId);

  const {
    params: {
      [CreatorHubCreationsPermissionParameters.EnableAtRiskAnnotationOnExperiences]:
        enableAtRiskAnnotation,
    },
    isFetched: isAtRiskAnnotationFetched,
  } = useIXPParameters(IXPLayers.CreatorHubCreationsPermission);

  const isLoading =
    enabled &&
    (isUniverseCreatorLoading ||
      isCreatorLoading ||
      isPublishEligibilityLoading ||
      isContentRatingLoading ||
      !isAtRiskAnnotationFetched);

  const isError =
    enabled &&
    (isUniverseCreatorError || isCreatorError || isPublishEligibilityError || isContentRatingError);

  const state = useMemo<AudienceValidationState>(() => {
    if (!enabled) {
      return NoneState;
    }
    // The "public-required" error is derived purely from form values and does
    // not depend on remote data, so surface it even while the other queries
    // are still loading.
    if (isLoading || isError) {
      if (isPublicConnectionsDisabled && !(audiences?.includes(Audience.Public) ?? false)) {
        return { type: 'error', kind: 'public-required' };
      }
      return NoneState;
    }
    if (!universeCreatorData || !creatorData || !universeEligibility || !contentRating) {
      if (isPublicConnectionsDisabled && !(audiences?.includes(Audience.Public) ?? false)) {
        return { type: 'error', kind: 'public-required' };
      }
      return NoneState;
    }
    return getAudienceValidationState({
      audiences,
      userCreatorTier: creatorData.creatorTier,
      universeCreatorTier: universeCreatorData.creatorTier,
      selectStatus: universeEligibility.selectStatus,
      reasons: universeEligibility.reasons ?? [],
      contentMinimumAge: contentRating.minimumAge,
      isUnrated: contentRating.isUnrated,
      enableAtRiskAnnotation: enableAtRiskAnnotation === true,
      isPublicConnectionsDisabled,
    });
  }, [
    enabled,
    isLoading,
    isError,
    universeCreatorData,
    creatorData,
    universeEligibility,
    contentRating,
    audiences,
    enableAtRiskAnnotation,
    isPublicConnectionsDisabled,
  ]);

  return { state, isLoading, isError };
};

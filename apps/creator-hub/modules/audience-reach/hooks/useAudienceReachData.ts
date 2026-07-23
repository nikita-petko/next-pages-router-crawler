import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CreatorHubCreationsPermissionParameters,
  IXPLayers,
} from '@modules/clients/ixpExperiments';
import placeSafetyStatusApi from '@modules/clients/placeSafetyStatus';
import useIXPParameters from '@modules/miscellaneous/hooks/useIXPParameters';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import {
  ContentThresholdMaxScore,
  ThresholdEligibilityWindowDays,
} from '../constants/audienceReachConstants';
import type { AudienceReachState } from '../types/audienceReach';
import { calculateReachState } from '../utils/reachCalculation';
import { useContentRatingDetails } from './useContentRatingDetails';
import { useUniverseCreatorEligibility } from './useUniverseCreatorEligibility';
import { useUniversePublishEligibility } from './useUniversePublishEligibility';

export const useAudienceReachData = (universeId: number) => {
  const {
    data: creatorTierData,
    isLoading: isCreatorTierLoading,
    isError: isCreatorTierError,
  } = useUniverseCreatorEligibility(universeId);

  const {
    data: contentRating,
    isLoading: isContentRatingLoading,
    isError: isContentRatingError,
  } = useContentRatingDetails(universeId);

  const {
    data: universeEligibility,
    isLoading: isSelectLoading,
    isError: isSelectError,
  } = useUniversePublishEligibility(universeId);

  const { gameDetails } = useCurrentGame();
  const rootPlaceId = gameDetails?.rootPlaceId;

  const { data: placeSafetyFlags, isLoading: isSequestrationLoading } = useQuery({
    queryKey: ['placeSafetyStatus', rootPlaceId],
    queryFn: async (): Promise<{ isRestricted: boolean; isDiscoveryBlocked: boolean }> => {
      if (!rootPlaceId) {
        return { isRestricted: false, isDiscoveryBlocked: false };
      }
      try {
        const res = await placeSafetyStatusApi.getPlaceSafetyStatusById(rootPlaceId);
        const status = res.placeSafetyStatus;
        const restriction: unknown = status?.userPlayabilityRestrictions;
        return {
          isRestricted: restriction === 'RestrictedForAll' || restriction === 'RestrictedToOwner',
          isDiscoveryBlocked: status?.discoveryBlocked === true,
        };
      } catch {
        return { isRestricted: false, isDiscoveryBlocked: false };
      }
    },
    enabled: !!rootPlaceId,
  });

  const { params, isFetched: isAtRiskAnnotationFetched } = useIXPParameters(
    IXPLayers.CreatorHubCreationsPermission,
  );
  const enableAtRiskAnnotation =
    params[CreatorHubCreationsPermissionParameters.EnableAtRiskAnnotationOnExperiences];

  const isLoading =
    isCreatorTierLoading ||
    isContentRatingLoading ||
    isSelectLoading ||
    isSequestrationLoading ||
    !isAtRiskAnnotationFetched;
  const isError = isCreatorTierError || isContentRatingError || isSelectError;

  const shouldHonorReasons = Boolean(enableAtRiskAnnotation);

  // "Experience is private" = the place is moderation-restricted (the page-level
  // banner explains the latter case in detail). True unpublished/private universes
  // are surfaced separately via Universe Configuration
  const isPrivate = placeSafetyFlags?.isRestricted ?? false;

  const state = useMemo((): AudienceReachState | null => {
    if (!creatorTierData || !contentRating || !universeEligibility) {
      return null;
    }

    const creatorTier = creatorTierData.creatorTier;
    const isUnrated = contentRating.isUnrated;
    const selectReasons = shouldHonorReasons ? universeEligibility.reasons : [];
    const isPublishedToGatedAudience = universeEligibility.publishedToGatedAudience ?? false;

    const calculationResult = calculateReachState({
      contentMinimumAge: contentRating.minimumAge,
      isUnrated,
      isPrivate,
      creatorTier,
      selectStatus: universeEligibility.selectStatus,
      selectReasons,
      isPublishedToGatedAudience,
      isUnderReview: universeEligibility.underReview ?? null,
    });

    const daysBelowThreshold = Number(universeEligibility.reasonsMetadata?.Threshold) || 0;
    const thresholdDaysRemaining = Math.max(0, ThresholdEligibilityWindowDays - daysBelowThreshold);

    return {
      ...calculationResult,
      creatorTier,
      creatorEveryoneWithoutSubscription: universeEligibility.ownerEveryoneTierWithoutSubscription,
      contentRating,
      isPrivate,
      selectIndicator: (universeEligibility.indicator ?? 0) * ContentThresholdMaxScore,
      indicatorLastUpdated: universeEligibility.engagedPlayersUpdatedAt ?? null,
      selectReasons,
      selectStatus: universeEligibility.selectStatus,
      thresholdDaysRemaining,
      underReview: universeEligibility.underReview ?? null,
      isPublishedToGatedAudience,
    };
  }, [creatorTierData, contentRating, universeEligibility, isPrivate, shouldHonorReasons]);

  return {
    state,
    isLoading,
    isError,
    isCreatorTierError,
    isContentRatingError,
    isSelectError,
    isRestricted: placeSafetyFlags?.isRestricted ?? false,
    isDiscoveryBlocked: placeSafetyFlags?.isDiscoveryBlocked ?? false,
  };
};

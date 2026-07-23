import { useQuery } from '@tanstack/react-query';
import experienceGuidelinesServiceApiClient from '@modules/clients/experienceGuidelinesService';
import { TransientQueryRetry, transientQueryRetryDelay } from '../constants/audienceReachConstants';
import type { ContentRatingDetails } from '../types/audienceReach';

export const contentRatingDetailsQueryKey = (universeId: number) =>
  ['experienceGuidelinesService', 'contentRatingDetails', universeId] as const;

export const useContentRatingDetails = (universeId: number) => {
  return useQuery({
    queryKey: contentRatingDetailsQueryKey(universeId),
    queryFn: async (): Promise<ContentRatingDetails> => {
      const response =
        await experienceGuidelinesServiceApiClient.getDetailedGuidelinesV2(universeId);

      if (!response) {
        return { ratingLabel: null, minimumAge: 0, descriptors: [], isUnrated: true };
      }

      const ageRecommendation =
        response.ageRecommendationDetails?.ageRecommendationSummary?.ageRecommendation;
      const contentMaturity = ageRecommendation?.contentMaturity;
      const isUnrated = contentMaturity === 'unrated' || !contentMaturity;

      const ratingLabel = ageRecommendation?.displayName ?? null;
      const minimumAge = ageRecommendation?.minimumAge ?? 0;

      const descriptors =
        response.ageRecommendationDetails?.experienceDescriptorUsages?.items
          ?.map((item) => item.experienceDescriptor?.displayName)
          .filter((name): name is string => !!name) ?? [];

      return { ratingLabel, minimumAge, descriptors, isUnrated };
    },
    enabled: !!universeId,
    retry: TransientQueryRetry,
    retryDelay: transientQueryRetryDelay,
  });
};

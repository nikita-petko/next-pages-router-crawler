import experienceGuidelinesServiceApiClient from '@modules/clients/experienceGuidelinesService';
import { createSimpleDebouncedCombinedAPICall } from '@modules/clients/utils';
import { useQuery } from '@tanstack/react-query';
import { V1Beta1MultiGetAgeRecommendationResponse } from '@rbx/clients/experienceGuidelinesService/v1';

import { GET_EXPERIENCE_GUIDELINES_QUERY_KEY } from '../../queryKeys';

// Additional context for how legacy Age Ratings map to the newer Maturity Ratings are available here:
// https://devforum.roblox.com/t/3249079
// https://en.help.roblox.com/hc/en-us/articles/8862768451604

/**
 * Returned from debouncedContentMaturity when content maturity is NOT found.
 * In the frontend, we will render Content Maturity: N/A.
 */
export const NO_CONTENT_MATURITY_FOUND_FOR_ID = 'NO_CONTENT_MATURITY_FOUND_FOR_ID' as const;

/**
 * A debounced API call that combines multiple requests into a single multiget API call.
 */
const debouncedContentMaturity = createSimpleDebouncedCombinedAPICall<
  number,
  V1Beta1MultiGetAgeRecommendationResponse,
  string
>({
  apiCall: (universeIds: number[]) =>
    experienceGuidelinesServiceApiClient.multiGetAgeRecommendations(universeIds),
  maxBatchSize: 50,
  getResult: (results, universeId) => {
    const result = results?.ageRecommendationDetailsByUniverse?.find(
      (rec) => rec.universeId === universeId,
    );

    if (
      !result?.ageRecommendationDetails?.ageRecommendationSummary?.ageRecommendation?.displayName
    ) {
      return NO_CONTENT_MATURITY_FOUND_FOR_ID;
    }

    // This is a string that maps age recommendation to the new Content Maturity ratings.
    // It's also already translated based on the user's locale, so we can render it directly.
    const { displayName } =
      result.ageRecommendationDetails.ageRecommendationSummary.ageRecommendation;
    return displayName;
  },
});

/**
 * A hook that returns the content maturity for a given universe ID.
 */
const useDebouncedContentMaturity = (universeId: number) => {
  return useQuery({
    queryKey: GET_EXPERIENCE_GUIDELINES_QUERY_KEY(universeId),
    queryFn: () => debouncedContentMaturity(universeId),
  });
};

export default useDebouncedContentMaturity;

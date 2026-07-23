import { useQuery } from '@tanstack/react-query';
import experienceGuidelinesApi from '@modules/clients/experienceGuidelinesApi';

export const GetExperienceGuidelinesFromId =
  'experienceGuidelinesApi/GetExperienceGuidelinesFromId';

// Additional context for how legacy Age Ratings map to the newer Maturity Ratings are available here:
// https://devforum.roblox.com/t/3249079
// https://en.help.roblox.com/hc/en-us/articles/8862768451604

interface GetExperienceGuidelinesFromIdParams {
  universeId?: number;
}

export const useGetExperienceGuidelines = ({ universeId }: GetExperienceGuidelinesFromIdParams) => {
  return useQuery({
    queryKey: [GetExperienceGuidelinesFromId, universeId],
    queryFn: async () => {
      if (!universeId) {
        throw new Error('Invalid universeId');
      }

      const response = await experienceGuidelinesApi.getAgeRecommendation(universeId);

      if (!response.ageRecommendationDetails?.summary?.ageRecommendation) {
        throw new Error('No maturity rating found');
      }

      // This is a string that maps age recommendation to the new Content Maturity ratings.
      // It's also already translated based on the user's locale, so we can render it directly.
      const { displayName } = response.ageRecommendationDetails.summary.ageRecommendation;
      return displayName;
    },
    enabled: !!universeId,
  });
};

export default useGetExperienceGuidelines;

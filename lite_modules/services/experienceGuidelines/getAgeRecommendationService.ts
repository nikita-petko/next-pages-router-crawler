import experienceGuidelinesClient from '@clients/experienceGuidelines';

export interface AgeRecommendation {
  displayName?: string | null;
  // Backend-formatted maturity label shown on the experience details page,
  // e.g. "Maturity: Minimal". Preferred over `displayName`.
  displayNameWithHeaderShort?: string | null;
  minimumAge?: number;
}

// Subset of experience-guidelines-api's GetAgeRecommendationResponse that we
// consume. See service-contracts openapi2/roblox/experienceguidelines.
interface GetAgeRecommendationResponse {
  ageRecommendationDetails?: {
    summary?: {
      ageRecommendation?: AgeRecommendation | null;
    } | null;
  } | null;
}

/**
 * Fetches the age recommendation (maturity) for a universe from
 * experience-guidelines-api. Returns the recommendation summary, or undefined
 * when the experience has no recommendation yet. Network/parse failures reject
 * so callers can fall back to a placeholder.
 */
export const getAgeRecommendation = async (
  universeId: number,
): Promise<AgeRecommendation | undefined> => {
  const response = await experienceGuidelinesClient.post<GetAgeRecommendationResponse>({
    body: { universeId },
    url: '/get-age-recommendation',
  });

  return response.data?.ageRecommendationDetails?.summary?.ageRecommendation ?? undefined;
};

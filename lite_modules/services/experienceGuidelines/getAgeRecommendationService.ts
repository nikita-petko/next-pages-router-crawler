import experienceGuidelinesClient from '@clients/experienceGuidelines';
import { MATURITY_PLACEHOLDER } from '@constants/campaignBuilder';

interface AgeRecommendation {
  displayName?: string | null;
  // Backend-formatted maturity label shown on the experience details page,
  // e.g. "Maturity: Minimal". Preferred over `displayName`.
  displayNameWithHeaderShort?: string | null;
  minimumAge?: number;
}

const recommendationByUniverseId = new Map<number, AgeRecommendation | undefined>();

// Mirrors the experience details page (web-frontend
// AgeRecommendationTitle / ContentMaturityLabel), which renders the maturity
// bracket as `displayNameWithHeaderShort ?? displayName` — a label the backend
// has already formatted (e.g. "Maturity: Minimal").
export const formatAgeRecommendationLabel = (
  recommendation: AgeRecommendation | undefined,
): string => {
  const label = (recommendation?.displayNameWithHeaderShort ?? recommendation?.displayName)?.trim();
  return label || MATURITY_PLACEHOLDER;
};

/**
 * Maturity label from the last successful {@link getAgeRecommendation} for this
 * universe. Undefined until that fetch completes, and never the loading
 * placeholder — callers that persist copy should not write "Maturity: Placeholder".
 */
export const getCachedAgeRecommendationLabel = (
  universeId: number | undefined,
): string | undefined => {
  if (universeId === undefined || !recommendationByUniverseId.has(universeId)) {
    return undefined;
  }
  const formatted = formatAgeRecommendationLabel(recommendationByUniverseId.get(universeId));
  return formatted === MATURITY_PLACEHOLDER ? undefined : formatted;
};

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

  const recommendation =
    response.data?.ageRecommendationDetails?.summary?.ageRecommendation ?? undefined;
  recommendationByUniverseId.set(universeId, recommendation);
  return recommendation;
};

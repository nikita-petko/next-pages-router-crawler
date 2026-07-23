import { useQuery } from '@tanstack/react-query';
import { developerAnalyticsAggregationsClient } from '@modules/clients/analytics';
import { uninitializedUniverseId } from '@modules/miscellaneous/common';

/**
 * The variant of experience overview page to display to users
 */
export enum OverviewVariant {
  // User sees only the header, nothing else.
  HeaderOnly,
  // User sees insights returned from the backend.
  Insights,
  // User sees static insight cards instead of results from backend.
  StaticInsights,
}

const fetchEligibility =
  developerAnalyticsAggregationsClient.getfeaturePermissionsGetFeaturePermission;

/**
 * Returns the variant of the overview page.
 * @param universeId - universe ID that we are querying.
 */
const useOverviewVariant = (universeId: number) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['featurePermission', universeId],
    queryFn: () => fetchEligibility({ universeId }),
    enabled: universeId !== uninitializedUniverseId,
    staleTime: 1000 * 60, // 1 mintue,
  });

  let variant = OverviewVariant.HeaderOnly;
  if (data) {
    if (!data.userCanViewAnalyticsForUniverse) {
      variant = OverviewVariant.HeaderOnly;
    } else {
      variant = data.experienceHasInsightsAccess
        ? OverviewVariant.Insights
        : OverviewVariant.StaticInsights;
    }
  }

  return { isLoading, isError, variant };
};

export default useOverviewVariant;

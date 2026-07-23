import { useState, useEffect } from 'react';
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
  const [isLoading, setLoading] = useState<boolean>(false);
  const [isError, setError] = useState<boolean>(false);
  const [variant, setVariant] = useState<OverviewVariant>(OverviewVariant.HeaderOnly);

  useEffect(() => {
    const fetchVariant = async () => {
      if (universeId === uninitializedUniverseId) {
        return;
      }

      try {
        setLoading(true);
        const {
          experienceHasInsightsAccess: has100DAUs,
          userCanViewAnalyticsForUniverse: hasPermission,
        } = await fetchEligibility({
          universeId,
        });

        if (!hasPermission) {
          setVariant(OverviewVariant.HeaderOnly);
          return;
        }

        setVariant(has100DAUs ? OverviewVariant.Insights : OverviewVariant.StaticInsights);
      } catch {
        setVariant(OverviewVariant.HeaderOnly);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchVariant();
  }, [universeId]);

  return { isLoading, isError, variant };
};

export default useOverviewVariant;

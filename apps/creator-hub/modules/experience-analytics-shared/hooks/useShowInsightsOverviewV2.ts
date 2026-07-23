import { useAuthentication } from '@modules/authentication/providers';
import { developerAnalyticsAggregationsClient } from '@modules/clients/analytics';
import { uninitializedUniverseId } from '@modules/miscellaneous/common';
import { useCallback, useEffect, useState } from 'react';
import { useUniverseResource } from './useChartResourceProvider';

const fetchEligibility =
  developerAnalyticsAggregationsClient.getfeaturePermissionsGetFeaturePermission;

const useShowInsightsOverviewV2 = (): boolean => {
  const { id: universeId } = useUniverseResource();
  const { user } = useAuthentication();
  const userId = user?.id;

  const [shouldShowInsightsV2Overview, setShouldShowInsightsV2Overview] = useState(false);

  const retrieveSequence = useCallback(async () => {
    if (userId === undefined || universeId === uninitializedUniverseId) {
      return;
    }

    // experienceHasInsightsAccess for >100DAU
    const { experienceHasInsightsAccess, userCanViewAnalyticsForUniverse } = await fetchEligibility(
      {
        universeId,
      },
    );

    const isEligible = userCanViewAnalyticsForUniverse && experienceHasInsightsAccess;
    setShouldShowInsightsV2Overview(!!isEligible);
  }, [userId, universeId, setShouldShowInsightsV2Overview]);

  useEffect(() => {
    // when we were running the experiment previously, the value was stored in local storage.
    // now that we had rollout the experiment. we can force to delete this item for user.
    // see https://github.rbx.com/Roblox/creator-hub/commit/7c7c042489a03686794be82d46ae05e8fc4546f1
    const keyToDelete = `insightsV2Overview.${userId ?? ''}-${universeId ?? ''}`;
    const keyToDeleteV2 = `insightsV2Overview.${userId ?? ''}-${universeId ?? ''}-v2`;
    localStorage.removeItem(keyToDelete);
    localStorage.removeItem(keyToDeleteV2);

    retrieveSequence();
  }, [retrieveSequence, universeId, userId]);

  return shouldShowInsightsV2Overview;
};
export default useShowInsightsOverviewV2;

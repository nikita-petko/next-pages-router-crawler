import {
  analyticsCreationOverviewNavigationItem,
  buildExperienceAnalyticsUrlWithParams,
} from '@modules/charts-generic';
import { FunctionComponent, useEffect } from 'react';
import { useRouter } from 'next/router';
import { uninitializedUniverseId } from '@modules/miscellaneous/common';
import { useUniverseResource } from '@modules/experience-analytics-shared';

/**
 * This is a legacy page that redirects to the Experience Overview Page instead. We keep this around for tracking
 * purposes - so that users who enter the route from `/dashboard/creations/{universeId}/analytics` can be differentiated from
 * those who enters the `/dashboard/creations/{universeId}/overview` page directly.
 */
const LegacyOverviewPage: FunctionComponent = () => {
  const { id: universeId } = useUniverseResource();
  const router = useRouter();
  useEffect(() => {
    if (universeId !== uninitializedUniverseId) {
      const url = buildExperienceAnalyticsUrlWithParams(
        analyticsCreationOverviewNavigationItem,
        {},
        universeId,
      );
      router.push(url);
    }
  }, [router, universeId]);

  return null;
};
export default LegacyOverviewPage;

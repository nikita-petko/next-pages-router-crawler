import React from 'react';
import { useRouter } from 'next/router';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { PageLoading } from '@modules/miscellaneous/common';
import { useUniverseResource } from '@modules/experience-analytics-shared';

const ConfigureAlertPage = () => {
  // TODO(@yukihe): add userCanManageAlertsForUniverse permission check when ready
  const { isExperienceAlertsEnabled, isFetched: isFlagsReady } = useFeatureFlagsForNamespace(
    'isExperienceAlertsEnabled',
    FeatureFlagNamespace.Analytics,
  );

  const { isLoading: isResourceLoading } = useUniverseResource();
  const router = useRouter();

  if (isFlagsReady && !isResourceLoading) {
    if (isExperienceAlertsEnabled) {
      return <div>placeholder</div>;
    }
    router.push('/404');
    return null;
  }

  return <PageLoading />;
};
export default ConfigureAlertPage;

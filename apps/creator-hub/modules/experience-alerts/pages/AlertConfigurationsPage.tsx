import React from 'react';
import { useRouter } from 'next/router';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { PageLoading } from '@modules/miscellaneous/common';
import {
  CreatorAnalyticsLayout,
  useRAQIV2TranslationDependencies,
  useUniverseResource,
} from '@modules/experience-analytics-shared';
import getAlertConfigurationPageConfig from '../components/alertConfigurationPageConfig';

const AlertConfigurationsPage = () => {
  // TODO(@yukihe): add userCanManageAlertsForUniverse permission check when ready
  const { isExperienceAlertsEnabled, isFetched: isFlagsReady } = useFeatureFlagsForNamespace(
    'isExperienceAlertsEnabled',
    FeatureFlagNamespace.Analytics,
  );
  const { translate } = useRAQIV2TranslationDependencies();
  const { isLoading: isResourceLoading, id } = useUniverseResource();
  const router = useRouter();

  if (isFlagsReady && !isResourceLoading) {
    if (isExperienceAlertsEnabled) {
      return <CreatorAnalyticsLayout config={getAlertConfigurationPageConfig(translate, id)} />;
    }
    router.push('/404');
    return null;
  }

  return <PageLoading />;
};
export default AlertConfigurationsPage;

import { useEffect } from 'react';
import { StatusCodes } from '@rbx/core';
import { useFlag } from '@rbx/flags';
import { CircularProgress } from '@rbx/ui';
import { isTargetingConfigsEnabled as isTargetingConfigsEnabledFlag } from '@generated/flags/creatorAnalytics';
import { analyticsConfigsNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import { client as creatorConfigsApi } from '@modules/clients/analytics/universeConfigs';
import { client as universeExperimentationApi } from '@modules/clients/analytics/universeExperimentation';
import { useHasUserSeenAnalyticsPage } from '@modules/creations/common/components/AnalyticsPageNewChip';
import { useAnalyticsExperiencePermissions } from '@modules/experience-analytics-shared/hooks/useAnalyticsPermissions';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { ErrorPage } from '@modules/miscellaneous/error';
import makeValidatedApi from './api/makeValidatedAPI';
import makeValidatedExperimentationAPI from './api/makeValidatedExperimentationAPI';
import CreatorConfigsClientProvider from './CreatorConfigsClientProvider';
import CreatorConfigsHubPageContent from './CreatorConfigsHubPageContent';
import CreatorConfigsHubPageContentV2 from './CreatorConfigsHubPageContentV2';
import CreatorConfigsRealtimeClientProvider from './CreatorConfigsRealtimeClientProvider';
import { CreatorExperimentationClientProvider } from './CreatorExperimentationClientProvider';
import useCanConfigureOrPublish from './hooks/useCanConfigureOrPublish';

const client = makeValidatedApi(creatorConfigsApi);
const experimentationClient = makeValidatedExperimentationAPI(universeExperimentationApi, client);
// Previously known as <RemoteConfigsPage />
const CreatorConfigsHubPage = () => {
  const { setHasUserSeen } = useHasUserSeenAnalyticsPage(analyticsConfigsNavigationItem.path);
  useEffect(() => {
    setHasUserSeen(true);
  }, [setHasUserSeen]);

  const { id: universeId } = useUniverseResource();
  const { userCanViewAnalyticsForUniverse, isPending: isPendingAnalyticsExperiencePermissions } =
    useAnalyticsExperiencePermissions(universeId);
  const { ready: isTargetingConfigsReady, value: isTargetingConfigsEnabledValue } = useFlag(
    isTargetingConfigsEnabledFlag,
    {
      universeId,
    },
  );
  const isTargetingConfigsEnabled = isTargetingConfigsReady && isTargetingConfigsEnabledValue;
  const { canConfigure } = useCanConfigureOrPublish();

  if (isPendingAnalyticsExperiencePermissions || !isTargetingConfigsReady) {
    return (
      <EmptyGrid>
        <CircularProgress data-testid='loading' />
      </EmptyGrid>
    );
  }

  if (!userCanViewAnalyticsForUniverse && !canConfigure) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  return (
    <CreatorConfigsClientProvider client={client}>
      <CreatorConfigsRealtimeClientProvider>
        {isTargetingConfigsEnabled ? (
          <CreatorExperimentationClientProvider client={experimentationClient}>
            <CreatorConfigsHubPageContentV2 />
          </CreatorExperimentationClientProvider>
        ) : (
          <CreatorConfigsHubPageContent />
        )}
      </CreatorConfigsRealtimeClientProvider>
    </CreatorConfigsClientProvider>
  );
};
export default CreatorConfigsHubPage;

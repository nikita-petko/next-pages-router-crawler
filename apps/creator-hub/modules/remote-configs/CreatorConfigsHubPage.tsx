import React, { useEffect } from 'react';
import { AnalyticsFlagGatedContext } from '@modules/experience-analytics-shared';
import { client as creatorConfigsApi } from '@modules/clients/analytics/universeConfigs';
import { analyticsConfigsNavigationItem } from '@modules/charts-generic';
import { useHasUserSeenAnalyticsPage } from '@modules/creations/common';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { EmptyGrid } from '@modules/miscellaneous/common';
import { CircularProgress } from '@rbx/ui';
import { StatusCodes } from '@rbx/core';
import { ErrorPage } from '@modules/miscellaneous/error';
import CreatorConfigsHubPageContent from './CreatorConfigsHubPageContent';
import CreatorConfigsHubPageContentV2 from './CreatorConfigsHubPageContentV2';
import CreatorConfigsClientProvider from './CreatorConfigsClientProvider';
import CreatorConfigsRealtimeClientProvider from './CreatorConfigsRealtimeClientProvider';
import makeValidatedApi from './api/makeValidatedAPI';
import useCanConfigureOrPublish from './hooks/useCanConfigureOrPublish';

const client = makeValidatedApi(creatorConfigsApi);
// Previously known as <RemoteConfigsPage />
const CreatorConfigsHubPage = () => {
  const { setHasUserSeen } = useHasUserSeenAnalyticsPage(analyticsConfigsNavigationItem.path);
  useEffect(() => {
    setHasUserSeen(true);
  }, [setHasUserSeen]);

  const { userCanViewAnalyticsForUniverse, isTargetingConfigsEnabled, isFetched } =
    useFeatureFlagsForNamespace(
      ['userCanViewAnalyticsForUniverse', 'isTargetingConfigsEnabled'] as const,
      FeatureFlagNamespace.Analytics,
    );
  const { canConfigure } = useCanConfigureOrPublish();

  if (!isFetched) {
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
    <AnalyticsFlagGatedContext flag='remoteConfigsEnabled'>
      <CreatorConfigsClientProvider client={client}>
        <CreatorConfigsRealtimeClientProvider>
          {isTargetingConfigsEnabled ? (
            <CreatorConfigsHubPageContentV2 />
          ) : (
            <CreatorConfigsHubPageContent />
          )}
        </CreatorConfigsRealtimeClientProvider>
      </CreatorConfigsClientProvider>
    </AnalyticsFlagGatedContext>
  );
};
export default CreatorConfigsHubPage;

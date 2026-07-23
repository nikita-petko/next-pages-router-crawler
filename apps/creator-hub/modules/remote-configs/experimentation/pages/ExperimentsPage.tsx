import { CreatorExperimentationClientProvider } from '@modules/remote-configs/CreatorExperimentationClientProvider';
import React, { useEffect } from 'react';
import { client as universeExperimentationApi } from '@modules/clients/analytics/universeExperimentation';
import { analyticsExperimentsNavigationItem } from '@modules/charts-generic';
import { useHasUserSeenAnalyticsPage } from '@modules/creations/common';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { EmptyGrid } from '@modules/miscellaneous/common';
import { ErrorPage } from '@modules/miscellaneous/error';
import { StatusCodes } from '@rbx/core';
import { CircularProgress } from '@rbx/ui';
import useCanConfigureOrPublish from '../../hooks/useCanConfigureOrPublish';
import makeValidatedExperimentationAPI from '../../api/makeValidatedExperimentationAPI';
import ExperimentsPageContent from './ExperimentsPageContent';

const client = makeValidatedExperimentationAPI(universeExperimentationApi);
const ExperimentsPage = () => {
  const { setHasUserSeen } = useHasUserSeenAnalyticsPage(analyticsExperimentsNavigationItem.path);
  useEffect(() => {
    setHasUserSeen(true);
  }, [setHasUserSeen]);

  const { userCanViewAnalyticsForUniverse, isFetched } = useFeatureFlagsForNamespace(
    'userCanViewAnalyticsForUniverse',
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
    <CreatorExperimentationClientProvider client={client}>
      <ExperimentsPageContent />
    </CreatorExperimentationClientProvider>
  );
};

export default ExperimentsPage;

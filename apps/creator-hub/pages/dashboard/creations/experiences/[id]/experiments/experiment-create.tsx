import React from 'react';
import type { NextLayoutPage } from 'next';
import { analyticsExperimentsCreateNavigationItem } from '@modules/charts-generic';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import ExperimentCreationPage from '@modules/remote-configs/experimentation/pages/ExperimentCreationPage';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { QueryBasedFeatureFlagsProvider } from '@modules/feature-flags/context/FeatureFlagsProvider';

const ExperimentsCreation: NextLayoutPage = () => {
  return (
    <QueryBasedFeatureFlagsProvider
      namespaces={[FeatureFlagNamespace.Matchmaking]}
      idType='universeId'>
      <ExperimentCreationPage />
    </QueryBasedFeatureFlagsProvider>
  );
};

ExperimentsCreation.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsExperimentsCreateNavigationItem });

export default ExperimentsCreation;

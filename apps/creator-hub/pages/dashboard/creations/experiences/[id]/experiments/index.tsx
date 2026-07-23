import React from 'react';
import type { NextLayoutPage } from 'next';
import { analyticsExperimentsNavigationItem } from '@modules/charts-generic';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import ExperimentsPage from '@modules/remote-configs/experimentation/pages/ExperimentsPage';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { QueryBasedFeatureFlagsProvider } from '@modules/feature-flags/context/FeatureFlagsProvider';

const Experiment: NextLayoutPage = () => {
  return (
    <QueryBasedFeatureFlagsProvider
      namespaces={[FeatureFlagNamespace.Matchmaking]}
      idType='universeId'>
      <ExperimentsPage />
    </QueryBasedFeatureFlagsProvider>
  );
};

Experiment.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsExperimentsNavigationItem });

export default Experiment;

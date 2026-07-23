import React from 'react';
import type { NextLayoutPage } from 'next';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { QueryBasedFeatureFlagsProvider } from '@modules/feature-flags/context/FeatureFlagsProvider';
import ConfigCreationPage from '@modules/remote-configs/ConfigCreationPage';
import { analyticsConfigsNavigationItem } from '@modules/charts-generic';

const ConfigCreate: NextLayoutPage = () => {
  return (
    <QueryBasedFeatureFlagsProvider
      namespaces={[FeatureFlagNamespace.Matchmaking]}
      idType='universeId'>
      <ConfigCreationPage />
    </QueryBasedFeatureFlagsProvider>
  );
};

ConfigCreate.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsConfigsNavigationItem });

export default ConfigCreate;

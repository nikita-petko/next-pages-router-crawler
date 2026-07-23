import React, { ReactNode } from 'react';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { FeatureFlagsProvider } from '@modules/feature-flags/context/FeatureFlagsProvider';
import RAQIV2ClientProvider from '../context/RAQIV2ClientProvider';
import AnalyticsOwnerOverrideProvider from '../context/AnalyticsOwnerOverrideProvider';

export default function getHomePageAnalyticsSectionProviders(page: NonNullable<ReactNode>) {
  return (
    <AnalyticsOwnerOverrideProvider>
      <RAQIV2ClientProvider>
        <FeatureFlagsProvider namespaces={[FeatureFlagNamespace.Analytics]}>
          {page}
        </FeatureFlagsProvider>
      </RAQIV2ClientProvider>
    </AnalyticsOwnerOverrideProvider>
  );
}

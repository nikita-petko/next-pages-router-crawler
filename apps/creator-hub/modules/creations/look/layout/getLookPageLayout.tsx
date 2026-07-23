import React, { ReactNode } from 'react';
import IALayoutExperiment from '@modules/creator-hub-layout/IALayoutExperiment';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { FeatureFlagsProvider } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { VerificationMetadataProvider } from '../../verification';
import LookDetailsProvider from '../hooks/LookDetailsProvider';
import LookLeftNavigation from '../components/LookLeftNavigation';

export default function getLookPageLayout(page: ReactNode) {
  return (
    <LookDetailsProvider>
      <VerificationMetadataProvider>
        <FeatureFlagsProvider namespaces={[FeatureFlagNamespace.Analytics]}>
          <IALayoutExperiment leftNavigationContents={<LookLeftNavigation />}>
            {page}
          </IALayoutExperiment>
        </FeatureFlagsProvider>
      </VerificationMetadataProvider>
    </LookDetailsProvider>
  );
}

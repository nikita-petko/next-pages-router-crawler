import React, { ReactNode } from 'react';
import IALayoutExperiment from '@modules/creator-hub-layout/IALayoutExperiment';
import ItemDetailsProvider from '../../itemConfiguration/hooks/ItemDetailsProvider';
import { VerificationMetadataProvider } from '../../verification';
import BundleLeftNavigation from '../components/BundleLeftNavigation';

export default function getBundlePageLayout(page: ReactNode) {
  return (
    <ItemDetailsProvider>
      <VerificationMetadataProvider>
        <IALayoutExperiment leftNavigationContents={<BundleLeftNavigation />}>
          {page}
        </IALayoutExperiment>
      </VerificationMetadataProvider>
    </ItemDetailsProvider>
  );
}

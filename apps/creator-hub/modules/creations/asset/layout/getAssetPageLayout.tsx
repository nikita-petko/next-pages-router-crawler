import React, { ReactNode } from 'react';
import IALayoutExperiment from '@modules/creator-hub-layout/IALayoutExperiment';
import { VerificationMetadataProvider } from '../../verification';
import AssetLeftNavigation from '../components/AssetLeftNavigation';
import ItemDetailsProvider from '../../itemConfiguration/hooks/ItemDetailsProvider';

export default function getAssetPageLayout(page: ReactNode) {
  return (
    <ItemDetailsProvider>
      <VerificationMetadataProvider>
        <IALayoutExperiment leftNavigationContents={<AssetLeftNavigation />}>
          {page}
        </IALayoutExperiment>
      </VerificationMetadataProvider>
    </ItemDetailsProvider>
  );
}

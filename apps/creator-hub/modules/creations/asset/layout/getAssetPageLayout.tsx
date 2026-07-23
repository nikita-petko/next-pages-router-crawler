import type { ReactNode } from 'react';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import ItemDetailsProvider from '../../itemConfiguration/hooks/ItemDetailsProvider';
import VerificationMetadataProvider from '../../verification/hooks/VerificationMetadataProvider';
import AssetLeftNavigation from '../components/AssetLeftNavigation';

export default function getAssetPageLayout(page: ReactNode) {
  return (
    <ItemDetailsProvider>
      <VerificationMetadataProvider>
        <CreatorHubLayout leftNavigationContents={<AssetLeftNavigation />}>{page}</CreatorHubLayout>
      </VerificationMetadataProvider>
    </ItemDetailsProvider>
  );
}

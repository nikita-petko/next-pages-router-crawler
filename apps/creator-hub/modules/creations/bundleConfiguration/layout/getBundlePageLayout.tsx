import type { ReactNode } from 'react';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import ItemDetailsProvider from '../../itemConfiguration/hooks/ItemDetailsProvider';
import VerificationMetadataProvider from '../../verification/hooks/VerificationMetadataProvider';
import BundleLeftNavigation from '../components/BundleLeftNavigation';

export default function getBundlePageLayout(page: ReactNode) {
  return (
    <ItemDetailsProvider>
      <VerificationMetadataProvider>
        <CreatorHubLayout leftNavigationContents={<BundleLeftNavigation />}>
          {page}
        </CreatorHubLayout>
      </VerificationMetadataProvider>
    </ItemDetailsProvider>
  );
}

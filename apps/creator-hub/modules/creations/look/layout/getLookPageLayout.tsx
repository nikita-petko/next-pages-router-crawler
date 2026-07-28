import type { ReactNode } from 'react';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import VerificationMetadataProvider from '../../verification/hooks/VerificationMetadataProvider';
import LookLeftNavigation from '../components/LookLeftNavigation';
import LookDetailsProvider from '../hooks/LookDetailsProvider';

export default function getLookPageLayout(page: ReactNode) {
  return (
    <LookDetailsProvider>
      <VerificationMetadataProvider>
        <CreatorHubLayout leftNavigationContents={<LookLeftNavigation />}>{page}</CreatorHubLayout>
      </VerificationMetadataProvider>
    </LookDetailsProvider>
  );
}

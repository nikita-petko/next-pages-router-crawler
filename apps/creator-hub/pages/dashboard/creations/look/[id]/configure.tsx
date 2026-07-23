import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { LookConfigureContainer, getLookPageLayout } from '@modules/creations';
import { VerificationMetadataProvider } from '@modules/creations/verification';

const Configure: NextLayoutPage = () => (
  <Authenticated>
    <VerificationMetadataProvider>
      <LookConfigureContainer />
    </VerificationMetadataProvider>
  </Authenticated>
);

Configure.getPageLayout = getLookPageLayout;

export default Configure;

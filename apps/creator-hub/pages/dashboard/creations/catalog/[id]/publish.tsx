import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { getAssetPageLayout, ItemConfigureContainer } from '@modules/creations';
import { VerificationMetadataProvider } from '@modules/creations/verification';

const Configure: NextLayoutPage = () => (
  <Authenticated>
    <VerificationMetadataProvider>
      <ItemConfigureContainer />
    </VerificationMetadataProvider>
  </Authenticated>
);

Configure.getPageLayout = getAssetPageLayout;

export default Configure;
